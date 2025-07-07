"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
// Helper to format slug
function formatSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to generate better slug suggestions
function generateSlugSuggestions(base: string, babyName: string) {
  // 50 good words for before/after the name
  const words = [
    "baby",
    "guess",
    "pool",
    "bet",
    "sweep",
    "game",
    "challenge",
    "contest",
    "picks",
    "party",
    "fun",
    "squad",
    "crew",
    "club",
    "mania",
    "bash",
    "fest",
    "vibes",
    "watch",
    "arrival",
    "bundle",
    "joy",
    "bloom",
    "bloomers",
    "sprout",
    "cutie",
    "cuties",
    "love",
    "joyride",
    "time",
    "moment",
    "magic",
    "future",
    "winner",
    "champ",
    "legend",
    "star",
    "dreams",
    "wishes",
    "hope",
    "miracle",
    "guessers",
    "squadron",
    "family",
    "friends",
    "circle",
    "journey",
    "adventure",
    "welcome",
    "celebration",
  ];
  // Remove hyphens and spaces from name
  const name = (babyName || "baby").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!name) return [];
  // Always include baby[name] and [name]guess
  const suggestions = [
    `baby${name}`,
    `${name}guess`,
    `${name}pool`,
    `${name}bet`,
    `${name}family`,
    `${name}game`,
    `${name}club`,
    `${name}challenge`,
    `${name}party`,
    `${name}mania`,
    `${name}crew`,
    `${name}friends`,
    `${name}circle`,
    `${name}adventure`,
    `${name}arrival`,
    `${name}bloom`,
    `${name}star`,
    `${name}winner`,
    `${name}champ`,
    `${name}miracle`,
    `${name}joy`,
    `${name}future`,
    `${name}moment`,
    `${name}magic`,
    `${name}hope`,
    `${name}legend`,
    `${name}dreams`,
    `${name}wishes`,
    `${name}cutie`,
    `${name}sprout`,
    `${name}bloomers`,
    `${name}watch`,
    `${name}vibes`,
    `${name}squad`,
    `${name}squadron`,
    `${name}picks`,
    `${name}joyride`,
    `${name}time`,
    `${name}welcome`,
    `${name}celebration`,
    `${name}bash`,
    `${name}fest`,
    `${name}bundle`,
    `${name}cuties`,
    `${name}love`,
    `${name}friends`,
    `${name}club`,
    `${name}pool`,
    `${name}bet`,
    `${name}guessers`,
  ];
  // Add a few random combos from the word list
  for (let i = 0; i < 8; i++) {
    const word = words[Math.floor(Math.random() * words.length)];
    suggestions.push(`${name}${word}`);
    suggestions.push(`${word}${name}`);
  }
  // Remove duplicates and any empty, then return only 4 suggestions
  const unique = suggestions.filter((s, i, arr) => s && arr.indexOf(s) === i);
  // Shuffle for variety
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, 4);
}
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { createPool, CreatePoolState } from "@/lib/actions/create/createPool";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";

export function CreateBabyPoolForm() {
  const router = useRouter();
  const initialState: CreatePoolState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createPool, initialState);
  const [submitted, setSubmitted] = useState(false);
  const [pricingModel, setPricingModel] =
    useState<keyof typeof pricingModelSigmas>("standard");
  // Example values for preview
  // Controlled state for mean values
  const [muWeight, setMuWeight] = useState(7.6);
  const [muDate] = useState(0); // 0 deviation from due date (in days)

  useEffect(() => {
    if (!submitted) return;
    if (state.message) {
      toast.error(state.message);
      setSubmitted(false); // reset after error
    } else if (
      state.message === null &&
      Object.keys(state.errors ?? {}).length === 0
    ) {
      toast.success("Pool created successfully!");
      setSubmitted(false); // reset after success
      // Redirect to the new pool page after a short delay for the toast
      setTimeout(() => {
        // Use the latest slug value from state
        const slugInput = document.getElementById("slug");
        const slugValue =
          slugInput && "value" in slugInput ? slugInput.value : "";
        if (slugValue) {
          router.push(`/baby/${slugValue}`);
        }
      }, 800);
    }
  }, [state, submitted, router]);

  function handleSubmit() {
    setSubmitted(true);
    // allow formAction to handle the rest
  }

  const [minPrice, setMinPrice] = useState(5);
  const [maxPrice, setMaxPrice] = useState(50);

  // Slug state and validation
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [slugError, setSlugError] = useState("");
  const [babyName, setBabyName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      setSlugError("");
      setSlugSuggestions([]);
      return;
    }
    setSlugChecking(true);
    setSlugError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Call API route to check slug
      try {
        const res = await fetch(
          `/api/baby/check-slug?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        if (data.available) {
          setSlugAvailable(true);
          setSlugError("");
          setSlugSuggestions([]);
        } else {
          setSlugAvailable(false);
          setSlugError("Slug is already taken. Please choose another.");
          // Generate suggestions and check each for uniqueness
          const rawSuggestions = generateSlugSuggestions(slug, babyName);
          // Check each suggestion in parallel
          const checks = await Promise.all(
            rawSuggestions.map(async (s) => {
              const res = await fetch(
                `/api/baby/check-slug?slug=${encodeURIComponent(s)}`
              );
              const data = await res.json();
              return data.available ? s : null;
            })
          );
          // Only show available suggestions, up to 4
          setSlugSuggestions(
            checks.filter((s): s is string => Boolean(s)).slice(0, 4)
          );
        }
      } catch {
        setSlugAvailable(null);
        setSlugError("Error checking slug availability.");
        setSlugSuggestions([]);
      } finally {
        setSlugChecking(false);
      }
    }, 400);
  }, [slug, babyName, dueDate]);

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <CardContent className="space-y-6 p-8">
        <div>
          <Label htmlFor="baby_name">Baby Name</Label>
          <Input
            id="baby_name"
            name="baby_name"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="e.g. Baby Smith"
            required
          />
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Pool Slug</Label>
          <p className="text-sm text-gray-500">
            This will be part of the shareable URL for your pool. Must be unique
            and can only contain lowercase letters and numbers.
          </p>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              const formatted = formatSlug(e.target.value);
              setSlug(formatted);
            }}
            placeholder="e.g. babymario"
            required
            className={clsx(
              slugAvailable === false && "border-red-500 focus:border-red-500"
            )}
            autoComplete="off"
          />
          {/* Muted preview of shareable URL */}
          <div className="text-xs text-muted-foreground mt-1">
            {slug
              ? `Shareable URL: ${
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://yourdomain.com"
                }/baby/${slug}`
              : ""}
          </div>
          {/* Slug validation feedback */}
          {slugChecking && (
            <div className="text-xs text-gray-400 mt-1">
              Checking availability...
            </div>
          )}
          {slugError && (
            <div className="text-xs text-red-500 mt-1">{slugError}</div>
          )}
          {/* Slug suggestions */}
          {slugAvailable === false && slugSuggestions.length > 0 && (
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
              Suggestions:
              {slugSuggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  className="bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 ml-1 border border-gray-200"
                  onClick={() => setSlug(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="mu_weight">Expected Weight (lbs)</Label>
          <p className="text-sm text-gray-500">
            The average or expected birth weight. This will be the peak of the
            weight price distribution.
          </p>
          <Input
            id="mu_weight"
            name="mu_weight"
            type="number"
            step="0.1"
            value={muWeight}
            onChange={(e) => setMuWeight(Number(e.target.value))}
            placeholder="e.g. 7.6"
            required
          />
        </div>
        {/* Optionally, you can add a field for muDate (date deviation in days) if you want the user to control it. */}

        {/* Price Range Configuration */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <div>
            <h3 className="text-xl font-semibold">
              Betting Price Configuration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Set the price range for your betting pool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price_floor" className="text-base font-medium">
                Minimum Bet Price ($)
              </Label>
              <p className="text-sm text-gray-500 mt-2">
                The price at the edges of the statistical range.
              </p>
              <Input
                id="price_floor"
                name="price_floor"
                type="number"
                min="1"
                step="1"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(Math.max(1, Math.floor(Number(e.target.value))))
                }
                placeholder="5"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="price_ceiling" className="text-base font-medium">
                Maximum Bet Price ($)
              </Label>
              <p className="text-sm text-gray-500 mt-2">
                The price for guessing the most statistically likely outcome.
              </p>
              <Input
                id="price_ceiling"
                name="price_ceiling"
                type="number"
                min="1"
                step="1"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(Math.max(1, Math.floor(Number(e.target.value))))
                }
                placeholder="50"
                required
                className="mt-2"
              />
            </div>
          </div>
        </div>
        {/* Pricing Model Selection */}
        <div>
          <label className="block font-medium mb-2">
            Select Pricing Model (Sigma Behavior)
          </label>
          <div className="flex gap-4 mb-4">
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="aggressive"
                checked={pricingModel === "aggressive"}
                onChange={() => setPricingModel("aggressive")}
              />
              <span className="ml-1">Aggressive</span>
            </label>
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="standard"
                checked={pricingModel === "standard"}
                onChange={() => setPricingModel("standard")}
              />
              <span className="ml-1">Standard</span>
            </label>
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="chill"
                checked={pricingModel === "chill"}
                onChange={() => setPricingModel("chill")}
              />
              <span className="ml-1">Chill</span>
            </label>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              {/* Calculate absolute date labels for the date graph */}
              {(() => {
                let minDateLabel = "-21d";
                let maxDateLabel = "+21d";
                let meanDateLabel = "Due Date";
                if (dueDate) {
                  const due = new Date(dueDate);
                  const minDate = new Date(due);
                  minDate.setDate(due.getDate() - 21);
                  const maxDate = new Date(due);
                  maxDate.setDate(due.getDate() + 21);
                  const format = (d: Date) =>
                    d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                  minDateLabel = format(minDate);
                  maxDateLabel = format(maxDate);
                  meanDateLabel = format(due);
                }
                return (
                  <GaussianCurve
                    currentGuess={muDate}
                    mean={muDate}
                    min={-21}
                    max={21}
                    minPrice={minPrice}
                    maxPrice={maxPrice / 2}
                    title={`Date Price Curve (${pricingModel})`}
                    meanLabel={meanDateLabel}
                    minLabel={minDateLabel}
                    maxLabel={maxDateLabel}
                    sigma={pricingModelSigmas[pricingModel].dateSigma}
                    className="py-8"
                    showGrid={false}
                  />
                );
              })()}
            </div>
            {/* Plus sign between the two curves */}
            <div
              className="flex items-center justify-center text-2xl font-bold text-gray-400 select-none"
              style={{ minWidth: 32 }}
            >
              +
            </div>
            <div className="flex-1">
              <GaussianCurve
                currentGuess={muWeight}
                mean={muWeight}
                min={Number((muWeight - 3).toFixed(1))}
                max={Number((muWeight + 3).toFixed(1))}
                minPrice={minPrice}
                maxPrice={maxPrice / 2}
                title={`Weight Price Curve (${pricingModel})`}
                meanLabel={`${muWeight} lbs`}
                minLabel={`${Number((muWeight - 3).toFixed(1))} lbs`}
                maxLabel={`${Number((muWeight + 3).toFixed(1))} lbs`}
                sigma={pricingModelSigmas[pricingModel].weightSigma}
                className="py-8"
                showGrid={false}
              />
            </div>
          </div>
        </div>
      </CardContent>
      {/* Hidden inputs to submit pricing model and formatted slug */}
      <input type="hidden" name="pricingModel" value={pricingModel} />
      <input type="hidden" name="slug" value={slug} />
      <CardFooter className="p-8 pt-0">
        <Button type="submit" className="w-full h-12 text-lg">
          Create Pool
        </Button>
      </CardFooter>
    </form>
  );
}
