"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { formatSlug, generateSlugSuggestions } from "@/lib/helpers/slug";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { createPool, CreatePoolState } from "@/lib/actions/create/createPool";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";

export function CreateBabyPoolForm() {
  // --- State ---
  // Form fields
  const [babyName, setBabyName] = useState("");
  const [slug, setSlug] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [organizedBy, setOrganizedBy] = useState("");
  const [organizerImagePreview, setOrganizerImagePreview] = useState<
    string | null
  >(null);
  // Pricing
  const [minPrice, setMinPrice] = useState<number | "">(5);
  const [maxPrice, setMaxPrice] = useState<number | "">(50);
  const [pricingModel, setPricingModel] =
    useState<keyof typeof pricingModelSigmas>("standard");
  // Weight/date
  const [muWeight, setMuWeight] = useState(7.4);
  const [muDate] = useState(0); // 0 deviation from due date (in days)

  // Slug validation
  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [slugError, setSlugError] = useState("");
  // Price validation
  const [priceError, setPriceError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // --- Handlers ---
  // Image upload handler
  const onImageChange = useCallback((file: File | null) => {
    if (file) {
      // Check file size (400kB limit)
      const maxSize = 400 * 1024; // 400kB in bytes
      if (file.size > maxSize) {
        toast.error(
          "Image file size must be under 400kB. Please choose a smaller image or compress it."
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, []);

  // Organizer image upload handler
  const onOrganizerImageChange = useCallback((file: File | null) => {
    if (file) {
      // Check file size (400kB limit)
      const maxSize = 400 * 1024; // 400kB in bytes
      if (file.size > maxSize) {
        toast.error(
          "Organizer image file size must be under 400kB. Please choose a smaller image or compress it."
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) =>
        setOrganizerImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setOrganizerImagePreview(null);
    }
  }, []);

  // --- Actions ---
  const initialState: CreatePoolState = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    createPool,
    initialState
  );

  // --- Effects ---
  // Toast error on state.message
  useEffect(() => {
    if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);

  // Debounced slug check
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
          const rawSuggestions = generateSlugSuggestions(slug, babyName);
          const checks = await Promise.all(
            rawSuggestions.map(async (s) => {
              const res = await fetch(
                `/api/baby/check-slug?slug=${encodeURIComponent(s)}`
              );
              const data = await res.json();
              return data.available ? s : null;
            })
          );
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

  // --- Helpers ---
  const formatWeightLabel = (weight: number) => {
    if (weight < 0) weight = 0;
    const lbs = Math.floor(weight);
    const oz = Math.round((weight % 1) * 16);
    if (oz === 16) {
      return `${lbs + 1} lbs 0 oz`;
    }
    return `${lbs} lbs ${oz} oz`;
  };

  // Helper functions to provide safe values for GaussianCurve
  const getSafeMinPrice = () => (typeof minPrice === "number" ? minPrice : 1);
  const getSafeMaxPrice = () => (typeof maxPrice === "number" ? maxPrice : 50);

  return (
    <form
      action={(formData) => {
        // Ensure we have valid price values before submission
        // Prevent submit if min/max relationship is invalid
        if (
          typeof minPrice === "number" &&
          typeof maxPrice === "number" &&
          maxPrice <= minPrice
        ) {
          setPriceError("Maximum price must be greater than minimum price");
          toast.error("Maximum price must be greater than minimum price");
          return;
        }

        if (minPrice === "") {
          formData.set("price_floor", "1");
        }
        if (maxPrice === "") {
          formData.set("price_ceiling", "50");
        }
        formAction(formData);
      }}
    >
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label
              htmlFor="baby_name"
              className="text-base font-semibold tracking-tight"
            >
              Baby Name
            </Label>
            <Input
              id="baby_name"
              name="baby_name"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="e.g. Baby Smith"
              required
              className="rounded"
            />
          </div>
          <div>
            <Label
              htmlFor="organized_by"
              className="text-base font-semibold tracking-tight"
            >
              Organized By
            </Label>
            <Input
              id="organized_by"
              name="organized_by"
              value={organizedBy}
              onChange={(e) => setOrganizedBy(e.target.value)}
              placeholder="e.g. Heather & Keegan"
              required
              className="rounded"
            />
          </div>
          <div>
            <Label
              htmlFor="slug"
              className="text-base font-semibold tracking-tight"
            >
              Pool Slug
            </Label>
            <p className="text-xs text-gray-500">
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
                "rounded",
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
          {/* Image Upload Drop Zone */}
          <div>
            <Label
              htmlFor="image_upload"
              className="text-base font-semibold tracking-tight"
            >
              Baby Image (Ultrasound)
            </Label>
            <div
              className={clsx(
                "border-2 border-dashed rounded-md p-4 mt-2 flex flex-col items-center justify-center cursor-pointer transition",
                imagePreview
                  ? "border-green-400"
                  : "border-gray-300 hover:border-blue-400"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  onImageChange(file);
                } else if (file && !file.type.startsWith("image/")) {
                  toast.error("Please select a valid image file.");
                }
              }}
              onClick={() => {
                document.getElementById("image_upload")?.click();
              }}
              style={{ minHeight: 120 }}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="max-h-32 mb-2 rounded"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="text-gray-500">
                  Drag & drop an image here, or click to select
                </span>
              )}
              <Button
                type="button"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("image_upload")?.click();
                }}
              >
                Choose Image
              </Button>
              <input
                id="image_upload"
                name="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.type.startsWith("image/")) {
                    onImageChange(file);
                  } else if (file && !file.type.startsWith("image/")) {
                    toast.error("Please select a valid image file.");
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional. Recommended size: square, under 400kB.
            </p>
          </div>

          {/* Organizer Image Upload Drop Zone */}
          <div>
            <Label
              htmlFor="organizer_image_upload"
              className="text-base font-semibold tracking-tight"
            >
              Organizer Image
            </Label>
            <div
              className={clsx(
                "border-2 border-dashed rounded-md p-4 mt-2 flex flex-col items-center justify-center cursor-pointer transition",
                organizerImagePreview
                  ? "border-green-400"
                  : "border-gray-300 hover:border-blue-400"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  onOrganizerImageChange(file);
                } else if (file && !file.type.startsWith("image/")) {
                  toast.error("Please select a valid image file.");
                }
              }}
              onClick={() => {
                document.getElementById("organizer_image_upload")?.click();
              }}
              style={{ minHeight: 120 }}
            >
              {organizerImagePreview ? (
                <Image
                  src={organizerImagePreview}
                  alt="Organizer Preview"
                  width={128}
                  height={128}
                  className="max-h-32 mb-2 rounded"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="text-gray-500">
                  Drag & drop an organizer image here, or click to select
                </span>
              )}
              <Button
                type="button"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("organizer_image_upload")?.click();
                }}
              >
                Choose Organizer Image
              </Button>
              <input
                id="organizer_image_upload"
                name="organizer_image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.type.startsWith("image/")) {
                    onOrganizerImageChange(file);
                  } else if (file && !file.type.startsWith("image/")) {
                    toast.error("Please select a valid image file.");
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional. Photo of the organizer(s). Recommended size: square,
              under 400kB.
            </p>
          </div>

          {/* Description Textarea */}
          <div>
            <Label
              htmlFor="description"
              className="text-base font-semibold tracking-tight"
            >
              Pool Description
            </Label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write something about this baby pool..."
              rows={4}
              className="w-full mt-2 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-input-background"
              maxLength={1000}
            />
            <div className="text-xs text-gray-400 mt-1">
              {description.length}/1000 characters
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Basic spacing and simple Markdown (line breaks, bold, links) are
              supported and will be rendered on the pool page.
            </div>
          </div>

          {/* Price Range Configuration */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-2xl tracking-tighter font-semibold">
                Pricing Model Configuration
              </h3>
              <p className="text-xs text-muted-foreground">
                Set the price range for your guessing pool.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex-1">
                <Label
                  htmlFor="due_date"
                  className="text-base font-semibold tracking-tight"
                >
                  Expected Due Date
                </Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="rounded mt-2"
                />
              </div>
              <div className="flex-1">
                <Label className="text-base font-semibold tracking-tight">
                  Expected Weight
                </Label>
                <div className="flex gap-4 items-center mt-2">
                  <div className="flex items-center gap-2">
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
                      className="rounded w-20 px-3 text-center"
                      required
                    />
                    <span className="text-sm text-muted-foreground">lbs</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                      className="rounded w-20 px-3 text-center"
                      required
                    />
                    <span className="text-sm text-muted-foreground">oz</span>
                  </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label
                  htmlFor="price_floor"
                  className="text-base font-semibold tracking-tight"
                >
                  Minimum Guess Price ($)
                </Label>
                <p className="text-xs text-muted-foreground">
                  The price at the edges of the statistical range.
                </p>
                <Input
                  id="price_floor"
                  name="price_floor"
                  type="number"
                  min={1}
                  max={
                    typeof maxPrice === "number"
                      ? Math.max(1, maxPrice - 1)
                      : undefined
                  }
                  step="1"
                  value={minPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setMinPrice("");
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        const newMin = Math.max(1, Math.floor(numValue));
                        // If max is set and would be <= newMin, bump max to newMin + 1
                        if (
                          typeof maxPrice === "number" &&
                          maxPrice <= newMin
                        ) {
                          setMaxPrice(newMin + 1);
                          setPriceError(null);
                        }
                        setMinPrice(newMin);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // If field is empty on blur, set to default
                    if (e.target.value === "") {
                      setMinPrice(1);
                    }
                    // Validate relationship on blur
                    if (
                      typeof minPrice === "number" &&
                      typeof maxPrice === "number"
                    ) {
                      if (maxPrice <= minPrice) {
                        setMaxPrice(minPrice + 1);
                        setPriceError(null);
                      } else {
                        setPriceError(null);
                      }
                    }
                  }}
                  placeholder="5"
                  required
                  className="rounded mt-2 px-4"
                />
              </div>
              <div>
                <Label
                  htmlFor="price_ceiling"
                  className="text-base font-semibold tracking-tight"
                >
                  Maximum Guess Price ($)
                </Label>
                <p className="text-xs text-muted-foreground">
                  The price for guessing the most statistically likely outcome.
                </p>
                <Input
                  id="price_ceiling"
                  name="price_ceiling"
                  type="number"
                  min={typeof minPrice === "number" ? minPrice + 1 : 1}
                  step="1"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setMaxPrice("");
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        const newMax = Math.max(1, Math.floor(numValue));
                        // If min is set and would be >= newMax, lower min (but not below 1)
                        if (
                          typeof minPrice === "number" &&
                          minPrice >= newMax
                        ) {
                          setMinPrice(Math.max(1, newMax - 1));
                          setPriceError(null);
                        }
                        setMaxPrice(newMax);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // If field is empty on blur, set to default
                    if (e.target.value === "") {
                      setMaxPrice(50);
                    }
                    // Validate relationship on blur
                    if (
                      typeof minPrice === "number" &&
                      typeof maxPrice === "number"
                    ) {
                      if (maxPrice <= minPrice) {
                        setMinPrice(Math.max(1, maxPrice - 1));
                        setPriceError(null);
                      } else {
                        setPriceError(null);
                      }
                    }
                  }}
                  placeholder="50"
                  required
                  className="rounded mt-2 w-full"
                />
                {/* Inline validation message for the price inputs */}
                {priceError && (
                  <div className="text-xs text-red-500 mt-2">{priceError}</div>
                )}
              </div>
            </div>
          </div>
          {/* Pricing Model Selection */}
          <div>
            <label className="font-semibold text-base tracking-tight">
              Select Pricing Model (Sigma Behavior)
            </label>
            <div className="flex gap-4 py-2">
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
            {/* Preview */}
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
                      minPrice={getSafeMinPrice() / 2}
                      maxPrice={getSafeMaxPrice() / 2}
                      title={`Date Price Curve (${pricingModel})`}
                      meanLabel={meanDateLabel}
                      minLabel={minDateLabel}
                      maxLabel={maxDateLabel}
                      sigma={pricingModelSigmas[pricingModel].dateSigma}
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
                  minPrice={getSafeMinPrice()}
                  maxPrice={getSafeMaxPrice() / 2}
                  title={`Weight Price Curve (${pricingModel})`}
                  meanLabel={formatWeightLabel(muWeight)}
                  minLabel={formatWeightLabel(muWeight - 3)}
                  maxLabel={formatWeightLabel(muWeight + 3)}
                  sigma={pricingModelSigmas[pricingModel].weightSigma}
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
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg"
          disabled={isPending}
          aria-disabled={isPending}
        >
          {isPending ? (
            <>
              <LoadingSpinner />
              Creating Pool...
            </>
          ) : (
            "Create Pool"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
