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
    if (state.success && state.slug) {
      toast.success("Pool created successfully!");
      // Redirect to the new pool page after a short delay for the toast
      setTimeout(() => {
        router.push(`/baby/${state.slug}`);
      }, 800);
    } else if (state.message) {
      toast.error(state.message);
    }
    setSubmitted(false); // reset after handling
  }, [state, submitted, router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // We are using useActionState, so we don't need to prevent default.
    // event.preventDefault();
    setSubmitted(true);
    // Create a FormData object from the form
    const formData = new FormData(event.currentTarget);
    // The formAction will be called automatically by the form's onSubmit
    // but we can call it manually if we need to.
    // In this case, we let the form handle it.
    // formAction(formData);
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

  const formatWeightLabel = (weight: number) => {
    if (weight < 0) weight = 0;
    const lbs = Math.floor(weight);
    const oz = Math.round((weight % 1) * 16);
    if (oz === 16) {
      return `${lbs + 1} lbs 0 oz`;
    }
    return `${lbs} lbs ${oz} oz`;
  };

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // We need to get the form data and pass it to the action.
        // However, because we are using a native form element,
        // we can just let the browser handle it.
        // The `handleSubmit` function is now mostly for setting the `submitted` state.
        setSubmitted(true);
      }}
    >
      <CardContent className="p-8">
        <div className="space-y-6">
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
            <Label htmlFor="slug">Pool Slug</Label>
            <p className="text-sm text-gray-500">
              This will be part of the shareable URL for your pool. Must be
              unique and can only contain lowercase letters and numbers.
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
          <div className="flex gap-8">
            <div className="flex-1">
              <Label htmlFor="due_date">Expected Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <Label>Expected Weight</Label>
              <div className="flex gap-4 items-center">
                <div>
                  <Label
                    htmlFor="mu_weight_lbs"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    Pounds (lbs)
                  </Label>
                  <Input
                    id="mu_weight_lbs"
                    name="mu_weight_lbs"
                    type="number"
                    min={0}
                    max={20}
                    value={Math.floor(muWeight)}
                    onChange={(e) => {
                      const lbs = Math.max(
                        0,
                        Math.min(20, Number(e.target.value))
                      );
                      setMuWeight(lbs + (muWeight % 1));
                    }}
                    className="w-16 px-2 py-1 border rounded text-center"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="mu_weight_oz"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    Ounces (oz)
                  </Label>
                  <Input
                    id="mu_weight_oz"
                    name="mu_weight_oz"
                    type="number"
                    min={0}
                    max={15}
                    value={Math.round((muWeight % 1) * 16)}
                    onChange={(e) => {
                      const oz = Math.max(
                        0,
                        Math.min(15, Number(e.target.value))
                      );
                      setMuWeight(Math.floor(muWeight) + oz / 16);
                    }}
                    className="w-16 px-2 py-1 border rounded text-center"
                    required
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {Math.floor(muWeight)} lbs {Math.round((muWeight % 1) * 16)}{" "}
                  oz
                </span>
              </div>
              {/* Hidden input for ounces for backend */}
              <input
                type="hidden"
                name="mu_weight_ounces"
                value={
                  Math.floor(muWeight) * 16 + Math.round((muWeight % 1) * 16)
                }
              />
            </div>
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
                <Label
                  htmlFor="price_ceiling"
                  className="text-base font-medium"
                >
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
                  meanLabel={formatWeightLabel(muWeight)}
                  minLabel={formatWeightLabel(muWeight - 3)}
                  maxLabel={formatWeightLabel(muWeight + 3)}
                  sigma={pricingModelSigmas[pricingModel].weightSigma}
                  className="py-8"
                  showGrid={false}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Hidden inputs to submit pricing model and formatted slug */}
        <input type="hidden" name="pricingModel" value={pricingModel} />
        <input type="hidden" name="slug" value={slug} />
      </CardContent>
      <CardFooter className="p-8 pt-0">
        <Button type="submit" className="w-full h-12 text-lg">
          Create Pool
        </Button>
      </CardFooter>
    </form>
  );
}
