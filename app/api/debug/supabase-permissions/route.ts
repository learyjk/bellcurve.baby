import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const poolId = searchParams.get("pool_id");
  const userId = searchParams.get("user_id");

  if (!poolId || !userId) {
    return NextResponse.json(
      { error: "pool_id and user_id are required query parameters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const diagnostics = {
    timestamp: new Date().toISOString(),
    pool_id: poolId,
    user_id: userId,
    tests: {} as Record<string, unknown>,
  };

  // Test 1: Pool access
  try {
    const { data: poolData, error: poolError } = await supabase
      .from("pools")
      .select("id, user_id, is_locked, baby_name")
      .eq("id", poolId)
      .single();

    diagnostics.tests.pool_access = {
      success: !poolError,
      error: poolError?.message,
      pool: poolData,
    };
  } catch (error) {
    diagnostics.tests.pool_access = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 2: User existence (if we have user management)
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    diagnostics.tests.auth_user = {
      success: !userError,
      error: userError?.message,
      current_user: user?.id,
      requested_user: userId,
      user_match: user?.id === userId,
    };
  } catch (error) {
    diagnostics.tests.auth_user = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 3: Guess table permissions
  try {
    const testGuess = {
      pool_id: poolId,
      user_id: userId,
      guessed_birth_date: "2025-10-01",
      guessed_weight: 7.5,
      calculated_price: 10.0,
      payment_id: `test_${Date.now()}`,
    };

    const { data: insertData, error: insertError } = await supabase
      .from("guesses")
      .insert(testGuess)
      .select()
      .single();

    if (insertData) {
      // Clean up test record
      await supabase.from("guesses").delete().eq("id", insertData.id);
      diagnostics.tests.guess_insert = {
        success: true,
        message: "Insert successful and cleaned up",
      };
    } else {
      diagnostics.tests.guess_insert = {
        success: false,
        error: insertError?.message,
        code: insertError?.code,
        hint: insertError?.hint,
        details: insertError?.details,
      };
    }
  } catch (error) {
    diagnostics.tests.guess_insert = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 4: Check existing guesses for this user/pool
  try {
    const { data: existingGuesses, error: queryError } = await supabase
      .from("guesses")
      .select("id, payment_id, created_at")
      .eq("pool_id", poolId)
      .eq("user_id", userId);

    diagnostics.tests.existing_guesses = {
      success: !queryError,
      error: queryError?.message,
      count: existingGuesses?.length || 0,
      guesses: existingGuesses,
    };
  } catch (error) {
    diagnostics.tests.existing_guesses = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
