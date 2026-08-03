"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  RequiredMark,
  OptionalMark,
  FieldError,
} from "@/components/ui/form-field";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { formatSlug, generateSlugSuggestions } from "@/lib/helpers/slug";
import { getVideoEmbed } from "@/lib/helpers/videoEmbed";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { DatePicker } from "@/components/ui/date-picker";
import {
  WeightSexSelector,
  SEX_WEIGHT_PRESETS,
  type BabySexGuess,
} from "@/components/ui/baby/weight-sex-selector";
import { createPool, CreatePoolState } from "@/lib/actions/create/createPool";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";
import {
  DEFAULT_PRICE_CEILING,
  DEFAULT_PRICE_FLOOR,
  MAX_PRICE_CEILING,
  MIN_PRICE_FLOOR,
  PLATFORM_FEE_PERCENT,
} from "@/lib/constants";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";

type FieldKey =
  | "baby_name"
  | "organized_by"
  | "slug"
  | "description"
  | "due_date"
  | "price_floor"
  | "price_ceiling"
  | "video_url"
  | "image"
  | "organizer_image";

type FieldErrors = Partial<Record<FieldKey, string>>;

/** Destructive ring/border treatment for invalid fields (design-system tokens). */
const invalidInputClass =
  "border-destructive focus-visible:ring-destructive";

const errorSummaryTitleId = "create-pool-error-summary-title";

export function CreateBabyPoolForm() {
  // --- State ---
  // Form fields
  const [babyName, setBabyName] = useState("");
  const [slug, setSlug] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const trimmedVideoUrl = videoUrl.trim();
  const videoEmbed = trimmedVideoUrl ? getVideoEmbed(trimmedVideoUrl) : null;
  const videoUrlValid = trimmedVideoUrl === "" || videoEmbed !== null;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [organizedBy, setOrganizedBy] = useState("");
  const [organizerImagePreview, setOrganizerImagePreview] = useState<
    string | null
  >(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [organizerDragActive, setOrganizerDragActive] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [organizerImageProcessing, setOrganizerImageProcessing] =
    useState(false);
  // Pricing
  const [minPrice, setMinPrice] = useState<number | "">(DEFAULT_PRICE_FLOOR);
  const [maxPrice, setMaxPrice] = useState<number | "">(DEFAULT_PRICE_CEILING);
  const [pricingModel, setPricingModel] =
    useState<keyof typeof pricingModelSigmas>("standard");
  // Weight/date
  const [muWeight, setMuWeight] = useState(SEX_WEIGHT_PRESETS.girl);
  const [sexGuess, setSexGuess] = useState<BabySexGuess | null>("girl");
  const [muDate] = useState(0); // 0 deviation from due date (in days)

  // Editing the lbs/oz inputs by hand deselects the preset pill if the value
  // no longer matches it, so the pills always reflect the actual weight.
  const setWeight = (weight: number) => {
    setMuWeight(weight);
    setSexGuess((prev) =>
      prev && Math.abs(SEX_WEIGHT_PRESETS[prev] - weight) < 1e-9 ? prev : null
    );
  };

  // Slug validation
  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [slugError, setSlugError] = useState("");
  // Price validation
  const [priceError, setPriceError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // --- Validation state ---
  // "Reward early, punish late": a field first validates on blur; once it has
  // an error it re-validates on every change so the error clears as soon as
  // it's fixed. `submitAttempt` increments on each failed submit and forces
  // all fields to show their errors (a counter, so re-submitting after a
  // failed attempt still re-renders and moves focus).
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {}
  );
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  const markTouched = useCallback((field: FieldKey) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  // --- Client validators (run on every render from current field state) ---
  const clientFieldError = useCallback(
    (field: FieldKey): string | null => {
      switch (field) {
        case "baby_name":
          return babyName.trim() ? null : "Enter the baby's name.";
        case "organized_by":
          return organizedBy.trim()
            ? null
            : "Enter who is organizing this pool.";
        case "description":
          if (!description.trim())
            return "Write a short description of the pool.";
          if (description.length > 1000)
            return "Description must be 1000 characters or fewer.";
          return null;
        case "due_date":
          return dueDate ? null : "Select the expected due date.";
        case "price_floor":
          return typeof minPrice === "number"
            ? null
            : "Enter a minimum guess price.";
        case "price_ceiling":
          return typeof maxPrice === "number"
            ? null
            : "Enter a maximum guess price.";
        case "video_url":
          return videoUrlValid
            ? null
            : "Unrecognized video link. Paste a YouTube or Vimeo URL, or leave it blank.";
        default:
          return null;
      }
    },
    [
      babyName,
      organizedBy,
      description,
      dueDate,
      minPrice,
      maxPrice,
      videoUrlValid,
    ]
  );

  // Cross-field: max price must exceed min price. Shown once, under the
  // ceiling input, on blur of either price field.
  const priceRelationError =
    typeof minPrice === "number" &&
    typeof maxPrice === "number" &&
    maxPrice <= minPrice
      ? "Maximum price must be greater than minimum price."
      : null;

  const getVisibleError = useCallback(
    (field: FieldKey): string | null => {
      const visible = submitAttempt > 0 || touched[field];
      if (!visible) return null;
      // Cross-field and async errors are only shown while their field is in
      // a visible state too.
      if (field === "slug") return slugError || serverErrors.slug || null;
      if (field === "price_ceiling")
        return (
          clientFieldError("price_ceiling") ||
          priceRelationError ||
          priceError ||
          serverErrors.price_ceiling ||
          null
        );
      if (field === "price_floor")
        return clientFieldError("price_floor") || serverErrors.price_floor || null;
      if (field === "image") return serverErrors.image || null;
      if (field === "organizer_image")
        return serverErrors.organizer_image || null;
      return clientFieldError(field) || serverErrors[field] || null;
    },
    [
      submitAttempt,
      touched,
      clientFieldError,
      slugError,
      priceRelationError,
      priceError,
      serverErrors,
    ]
  );

  // --- Form validity (drives the summary and the submit guard) ---
  const formErrors: FieldErrors = {};
  (
    [
      "baby_name",
      "organized_by",
      "slug",
      "description",
      "due_date",
      "price_floor",
      "price_ceiling",
      "video_url",
    ] as FieldKey[]
  ).forEach((field) => {
    const err =
      field === "price_ceiling"
        ? clientFieldError("price_ceiling") || priceRelationError
        : field === "slug"
          ? slugError || serverErrors.slug
          : clientFieldError(field);
    if (err) formErrors[field] = err;
  });
  // A slug that hasn't been confirmed available blocks submission, but the
  // empty-slug message is friendlier than "still checking".
  if (!formErrors.slug && slug.trim() && slugAvailable !== true) {
    formErrors.slug = slugChecking
      ? "We're still checking this URL — wait a moment."
      : "This URL isn't available. Please choose another.";
  }
  const isFormValid = Object.keys(formErrors).length === 0;

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

      setImageProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setImageProcessing(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file. Please try another image.");
        setImageProcessing(false);
      };
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

      setOrganizerImageProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setOrganizerImagePreview(e.target?.result as string);
        setOrganizerImageProcessing(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file. Please try another image.");
        setOrganizerImageProcessing(false);
      };
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

  const isSubmitDisabled =
    isPending || imageProcessing || organizerImageProcessing;

  // --- Focus helpers ---
  const focusField = (field: FieldKey) => {
    const el = fieldRefs.current[field];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };

  // --- Effects ---
  // Move focus to the error summary whenever a new validation round mounts
  // it (GOV.UK error-summary pattern). Runs after the DOM update, so no
  // timing hacks are needed.
  useEffect(() => {
    if (submitAttempt > 0 && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
      errorSummaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [submitAttempt]);

  // On server response: map field errors inline, toast the form-level
  // message, and move focus to the error summary.
  useEffect(() => {
    if (!state?.message && !state?.errors) return;
    if (state?.message) {
      toast.error(state.message);
    }
    if (state?.errors && Object.keys(state.errors).length > 0) {
      const mapped: FieldErrors = {};
      for (const [field, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) mapped[field as FieldKey] = messages[0];
      }
      setServerErrors(mapped);
    }
    if (state?.message) {
      // Increment (not just set) so the focus effect fires even when the
      // form was already in an attempted state.
      setSubmitAttempt((n) => n + 1);
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

  const errorEntries = Object.entries(formErrors) as [FieldKey, string][];

  // We handle validation ourselves (inline errors + summary), so the form
  // uses noValidate to suppress native bubbles, which would appear
  // one-at-a-time at odd times.
  return (
    <form
      noValidate
      action={(formData) => {
        if (!isFormValid) {
          // Bump the attempt counter — the summary + inline errors render
          // and the focus effect moves to the summary.
          setSubmitAttempt((n) => n + 1);
          toast.error("Please fix the fields highlighted below.");
          return;
        }
        setServerErrors({});
        formAction(formData);
      }}
    >
      <CardContent>
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Fields marked with <RequiredMark /> are required.
          </p>

          {/* Error summary (GOV.UK pattern): rendered on a failed submit
              attempt or when the server rejects the form. Each item links to
              and focuses its field. */}
          {(submitAttempt > 0 || state?.message) &&
            (errorEntries.length > 0 || state?.message) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                aria-labelledby={errorSummaryTitleId}
                className="rounded-md border border-destructive/50 bg-destructive/5 p-4 focus:outline-none"
              >
                <h2
                  id={errorSummaryTitleId}
                  className="text-sm font-semibold text-destructive"
                >
                  There is a problem
                </h2>
                <ul className="mt-2 space-y-1">
                  {errorEntries.map(([field, message]) => (
                    <li key={field} className="text-xs">
                      <button
                        type="button"
                        onClick={() => focusField(field)}
                        className="flex items-start gap-1 text-left text-destructive underline underline-offset-2 hover:text-destructive/80"
                      >
                        <CircleAlert
                          className="mt-px h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          <div>
            <Label
              htmlFor="baby_name"
              className="text-base font-semibold tracking-tight"
            >
              Baby Name
              <RequiredMark />
            </Label>
            <Input
              ref={(el) => {
                fieldRefs.current.baby_name = el;
              }}
              id="baby_name"
              name="baby_name"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              onBlur={() => markTouched("baby_name")}
              placeholder="e.g. Baby Smith"
              required
              className={clsx(
                "rounded-md mt-2",
                getVisibleError("baby_name") && invalidInputClass
              )}
              aria-invalid={!!getVisibleError("baby_name")}
              aria-describedby={
                getVisibleError("baby_name") ? "baby_name-error" : undefined
              }
            />
            <FieldError id="baby_name-error" message={getVisibleError("baby_name")} />
          </div>
          <div>
            <Label
              htmlFor="organized_by"
              className="text-base font-semibold tracking-tight"
            >
              Organized By
              <RequiredMark />
            </Label>
            <Input
              ref={(el) => {
                fieldRefs.current.organized_by = el;
              }}
              id="organized_by"
              name="organized_by"
              value={organizedBy}
              onChange={(e) => setOrganizedBy(e.target.value)}
              onBlur={() => markTouched("organized_by")}
              placeholder="e.g. Heather & Keegan"
              required
              className={clsx(
                "rounded-md mt-2",
                getVisibleError("organized_by") && invalidInputClass
              )}
              aria-invalid={!!getVisibleError("organized_by")}
              aria-describedby={
                getVisibleError("organized_by")
                  ? "organized_by-error"
                  : undefined
              }
            />
            <FieldError
              id="organized_by-error"
              message={getVisibleError("organized_by")}
            />
          </div>
          <div>
            <Label
              htmlFor="slug"
              className="text-base font-semibold tracking-tight"
            >
              Pool Slug
              <RequiredMark />
            </Label>
            <p className="text-xs text-gray-500">
              This will be part of the shareable URL for your pool. Must be
              unique and can only contain lowercase letters and numbers.
            </p>
            <Input
              ref={(el) => {
                fieldRefs.current.slug = el;
              }}
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                const formatted = formatSlug(e.target.value);
                setSlug(formatted);
                // Choosing/typing a new slug clears any stale server error.
                setServerErrors((prev) =>
                  prev.slug ? { ...prev, slug: undefined } : prev
                );
              }}
              onBlur={() => markTouched("slug")}
              placeholder="e.g. babymario"
              required
              className={clsx(
                "rounded-md",
                (getVisibleError("slug") ||
                  (touched.slug && slug && slugAvailable === false)) &&
                  invalidInputClass
              )}
              aria-invalid={
                !!(
                  getVisibleError("slug") ||
                  (touched.slug && slug && slugAvailable === false)
                )
              }
              aria-describedby={
                getVisibleError("slug")
                  ? "slug-error"
                  : slug && slugAvailable === true
                    ? "slug-success"
                    : undefined
              }
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
            {slugChecking && slug && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <LoaderCircle
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Checking availability...
              </div>
            )}
            {!slugChecking && slug && slugAvailable === true && (
              <div
                id="slug-success"
                className="flex items-center gap-1 text-xs text-green-600 mt-1"
              >
                <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                This URL is available.
              </div>
            )}
            <FieldError id="slug-error" message={getVisibleError("slug")} />
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
          </div>          {/* Image Upload Drop Zone */}
          <div>
            <Label
              htmlFor="image_upload"
              className="text-base font-semibold tracking-tight"
            >
              Baby Image (Ultrasound)
              <OptionalMark />
            </Label>
            <div
              className={clsx(
                "border-2 border-dashed rounded-md p-4 mt-2 flex flex-col items-center justify-center cursor-pointer transition",
                imageDragActive
                  ? "border-blue-400 bg-blue-50"
                  : getVisibleError("image")
                    ? "border-destructive"
                    : imagePreview
                      ? "border-green-400"
                      : "border-gray-300 hover:border-blue-400"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  const input = document.getElementById(
                    "image_upload"
                  ) as HTMLInputElement | null;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                  }
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
                ref={(el) => {
                  fieldRefs.current.image = el;
                }}
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
            {imageProcessing && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <LoadingSpinner />
                Processing image...
              </div>
            )}
            <FieldError id="image-error" message={getVisibleError("image")} />
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
              <OptionalMark />
            </Label>
            <div
              className={clsx(
                "border-2 border-dashed rounded-md p-4 mt-2 flex flex-col items-center justify-center cursor-pointer transition",
                organizerDragActive
                  ? "border-blue-400 bg-blue-50"
                  : getVisibleError("organizer_image")
                    ? "border-destructive"
                    : organizerImagePreview
                      ? "border-green-400"
                      : "border-gray-300 hover:border-blue-400"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOrganizerDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOrganizerDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOrganizerDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  const input = document.getElementById(
                    "organizer_image_upload"
                  ) as HTMLInputElement | null;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                  }
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
                ref={(el) => {
                  fieldRefs.current.organizer_image = el;
                }}
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
            {organizerImageProcessing && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <LoadingSpinner />
                Processing image...
              </div>
            )}
            <FieldError
              id="organizer_image-error"
              message={getVisibleError("organizer_image")}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional. Photo of the organizer(s). Recommended size: square,
              under 400kB.
            </p>
          </div>          {/* Description Textarea */}
          <div>
            <Label
              htmlFor="description"
              className="text-base font-semibold tracking-tight"
            >
              Pool Description
              <RequiredMark />
            </Label>
            <textarea
              ref={(el) => {
                fieldRefs.current.description = el;
              }}
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched("description")}
              placeholder="Write something about this baby pool..."
              rows={4}
              required
              className={clsx(
                "w-full mt-2 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-input-background",
                getVisibleError("description") && invalidInputClass
              )}
              maxLength={1000}
              aria-invalid={!!getVisibleError("description")}
              aria-describedby={
                getVisibleError("description")
                  ? "description-error"
                  : undefined
              }
            />
            <FieldError
              id="description-error"
              message={getVisibleError("description")}
            />
            <div className="text-xs text-gray-400 mt-1">
              {description.length}/1000 characters
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Basic spacing and simple Markdown (line breaks, bold, links) are
              supported and will be rendered on the pool page.
            </div>
          </div>

          {/* Optional video embed (YouTube/Vimeo) */}
          <div>
            <Label
              htmlFor="video_url"
              className="text-base font-semibold tracking-tight"
            >
              Video
              <OptionalMark />
            </Label>
            <Input
              ref={(el) => {
                fieldRefs.current.video_url = el;
              }}
              id="video_url"
              name="video_url"
              type="url"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() => markTouched("video_url")}
              placeholder="https://www.youtube.com/watch?v=..."
              className={clsx(
                "rounded-md mt-2",
                getVisibleError("video_url") && invalidInputClass
              )}
              aria-invalid={!!getVisibleError("video_url")}
              aria-describedby={
                getVisibleError("video_url") ? "video_url-error" : undefined
              }
            />
            <FieldError
              id="video_url-error"
              message={getVisibleError("video_url")}
            />
            {videoUrlValid && videoEmbed && (
              <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {videoEmbed.provider === "youtube" ? "YouTube" : "Vimeo"} video
                recognized — it will be embedded on your pool page.
              </p>
            )}
            {!trimmedVideoUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Add a YouTube or Vimeo link and it will be embedded on your
                pool page. The video stays hosted there — we don&apos;t store
                or host any video files.
              </p>
            )}
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
                  <RequiredMark />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Guesses cost the most right around the due date.
                </p>
                <div
                  ref={(el) => {
                    fieldRefs.current.due_date = el;
                  }}
                  tabIndex={-1}
                  className="focus:outline-none"
                >
                  <DatePicker
                    id="due_date"
                    value={dueDate}
                    onChange={(value) => {
                      setDueDate(value);
                      markTouched("due_date");
                    }}
                    placeholder="Select the expected due date"
                    className={clsx(
                      "mt-2",
                      getVisibleError("due_date") && invalidInputClass
                    )}
                  />
                </div>
                {/* Submitted with the form; value format matches the old
                    input[type=date] (yyyy-mm-dd) so the server action is
                    unchanged. Validation is handled in React (the form uses
                    noValidate). */}
                <input type="hidden" name="due_date" value={dueDate} />
                <FieldError
                  id="due_date-error"
                  message={getVisibleError("due_date")}
                />
              </div>
              <div className="flex-1">
                <Label className="text-base font-semibold tracking-tight">
                  Expected Weight
                  <RequiredMark />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Global averages, or enter your own.
                </p>
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
                        setWeight(lbs + (muWeight % 1));
                      }}
                      className="rounded-md w-20 px-3 text-center"
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
                        setWeight(Math.floor(muWeight) + oz / 16);
                      }}
                      className="rounded-md w-20 px-3 text-center"
                      required
                    />
                    <span className="text-sm text-muted-foreground">oz</span>
                  </div>
                </div>
                <WeightSexSelector
                  className="mt-2"
                  value={sexGuess}
                  onChange={(sex) => {
                    setSexGuess(sex);
                    setMuWeight(SEX_WEIGHT_PRESETS[sex]);
                  }}
                />
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
                  <RequiredMark />
                </Label>
                <p className="text-xs text-muted-foreground">
                  The price at the edges of the statistical range.
                </p>
                <Input
                  ref={(el) => {
                    fieldRefs.current.price_floor = el;
                  }}
                  id="price_floor"
                  name="price_floor"
                  type="number"
                  min={MIN_PRICE_FLOOR}
                  max={
                    typeof maxPrice === "number"
                      ? Math.max(MIN_PRICE_FLOOR, maxPrice - 1)
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
                        const newMin = Math.max(
                          MIN_PRICE_FLOOR,
                          Math.floor(numValue)
                        );
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
                    markTouched("price_floor");
                    // If field is empty on blur, set to default
                    if (e.target.value === "") {
                      setMinPrice(DEFAULT_PRICE_FLOOR);
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
                  className={clsx(
                    "rounded-md mt-2 px-4",
                    getVisibleError("price_floor") && invalidInputClass
                  )}
                  aria-invalid={!!getVisibleError("price_floor")}
                  aria-describedby={
                    getVisibleError("price_floor")
                      ? "price_floor-error"
                      : undefined
                  }
                />
                <FieldError
                  id="price_floor-error"
                  message={getVisibleError("price_floor")}
                />
              </div>
              <div>
                <Label
                  htmlFor="price_ceiling"
                  className="text-base font-semibold tracking-tight"
                >
                  Maximum Guess Price ($)
                  <RequiredMark />
                </Label>
                <p className="text-xs text-muted-foreground">
                  The price for guessing the most statistically likely outcome.
                </p>
                <Input
                  ref={(el) => {
                    fieldRefs.current.price_ceiling = el;
                  }}
                  id="price_ceiling"
                  name="price_ceiling"
                  type="number"
                  min={typeof minPrice === "number" ? minPrice + 1 : 1}
                  max={MAX_PRICE_CEILING}
                  step="1"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setMaxPrice("");
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        const newMax = Math.min(
                          MAX_PRICE_CEILING,
                          Math.max(1, Math.floor(numValue))
                        );
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
                    markTouched("price_ceiling");
                    // If field is empty on blur, set to default
                    if (e.target.value === "") {
                      setMaxPrice(DEFAULT_PRICE_CEILING);
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
                  className={clsx(
                    "rounded-md mt-2 w-full",
                    getVisibleError("price_ceiling") && invalidInputClass
                  )}
                  aria-invalid={!!getVisibleError("price_ceiling")}
                  aria-describedby={
                    getVisibleError("price_ceiling")
                      ? "price_ceiling-error"
                      : undefined
                  }
                />
                {/* Inline validation message for the price inputs, including
                    the cross-field "max must exceed min" rule */}
                <FieldError
                  id="price_ceiling-error"
                  message={getVisibleError("price_ceiling")}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum ${MIN_PRICE_FLOOR}, maximum ${MAX_PRICE_CEILING}. You
              keep {Math.round((1 - PLATFORM_FEE_PERCENT) * 100)}% of every
              guess — bellcurve.baby takes a{" "}
              {Math.round(PLATFORM_FEE_PERCENT * 100)}% platform fee, and
              standard card processing applies.
            </p>
          </div>          {/* Pricing Model Selection */}
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
                      width={280}
                      height={120}
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
                  minPrice={getSafeMinPrice() / 2}
                  maxPrice={getSafeMaxPrice() / 2}
                  title={`Weight Price Curve (${pricingModel})`}
                  meanLabel={formatWeightLabel(muWeight)}
                  minLabel={formatWeightLabel(muWeight - 3)}
                  maxLabel={formatWeightLabel(muWeight + 3)}
                  sigma={pricingModelSigmas[pricingModel].weightSigma}
                  showGrid={false}
                  width={280}
                  height={120}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Hidden inputs to submit pricing model and formatted slug */}
        <input type="hidden" name="pricingModel" value={pricingModel} />
        <input type="hidden" name="slug" value={slug} />
      </CardContent>
      <CardFooter className="p-8 pt-0 flex-col items-stretch">
        {/* The submit button stays enabled while editing: clicking it runs
            validation and points at what's missing (NN/g guidance — a
            disabled button leaves users guessing). It is only disabled while
            a submission or image processing is actually in flight. */}
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg"
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
        >
          {isPending ? (
            <>
              <LoadingSpinner />
              Creating Pool...
            </>
          ) : imageProcessing || organizerImageProcessing ? (
            <>
              <LoadingSpinner />
              Processing image...
            </>
          ) : (
            "Create Pool"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}