"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { DatePicker } from "@/components/ui/date-picker";
import { updatePool, UpdatePoolState } from "@/lib/actions/edit/updatePool";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tables } from "@/database.types";

export function EditPoolForm({ pool }: { pool: Tables<"pools"> }) {
  const initialOz = pool.mu_weight ?? 118.4; // 7.4 lbs fallback
  const [babyName, setBabyName] = useState(pool.baby_name ?? "");
  const [organizedBy, setOrganizedBy] = useState(pool.organized_by ?? "");
  const [dueDate, setDueDate] = useState(pool.mu_due_date ?? "");
  const [description, setDescription] = useState(pool.description ?? "");
  const [videoUrl, setVideoUrl] = useState(pool.video_url ?? "");
  const [muWeight, setMuWeight] = useState(initialOz / 16); // lbs for the UI
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [organizerImagePreview, setOrganizerImagePreview] = useState<
    string | null
  >(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeOrganizerImage, setRemoveOrganizerImage] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [organizerDragActive, setOrganizerDragActive] = useState(false);

  // --- Image upload handlers ---
  const onImageChange = useCallback((file: File | null) => {
    if (file) {
      const maxSize = 400 * 1024;
      if (file.size > maxSize) {
        toast.error(
          "Image file size must be under 400kB. Please choose a smaller image or compress it."
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setRemoveImage(false);
    } else {
      setImagePreview(null);
    }
  }, []);

  const onOrganizerImageChange = useCallback((file: File | null) => {
    if (file) {
      const maxSize = 400 * 1024;
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
      setRemoveOrganizerImage(false);
    } else {
      setOrganizerImagePreview(null);
    }
  }, []);

  // --- Action ---
  const initialState: UpdatePoolState = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    updatePool,
    initialState
  );

  useEffect(() => {
    if (!state?.message) return;
    if (state.success) {
      toast.success(state.message);
      setImagePreview(null);
      setOrganizerImagePreview(null);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const shownBabyImage = imagePreview ?? (removeImage ? null : pool.image_url);
  const shownOrganizerImage =
    organizerImagePreview ??
    (removeOrganizerImage ? null : pool.organizer_image_url);

  return (
    <form action={formAction}>
      <input type="hidden" name="pool_id" value={pool.id} />
      <input type="hidden" name="remove_image" value={removeImage ? "1" : ""} />
      <input
        type="hidden"
        name="remove_organizer_image"
        value={removeOrganizerImage ? "1" : ""}
      />
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

          {/* Baby Image */}
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
                imageDragActive
                  ? "border-blue-400 bg-blue-50"
                  : shownBabyImage
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
                  onImageChange(file);
                } else if (file) {
                  toast.error("Please select a valid image file.");
                }
              }}
              onClick={() =>
                document.getElementById("image_upload")?.click()
              }
              style={{ minHeight: 120 }}
            >
              {shownBabyImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shownBabyImage}
                  alt="Baby pool"
                  className="max-h-32 mb-2 rounded object-cover"
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
                {shownBabyImage ? "Replace Image" : "Choose Image"}
              </Button>
              {shownBabyImage && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setRemoveImage(true);
                  }}
                >
                  Remove Image
                </Button>
              )}
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
                  } else if (file) {
                    toast.error("Please select a valid image file.");
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional. Recommended size: square, under 400kB. Uploading a new
              image replaces the current one.
            </p>
          </div>

          {/* Organizer Image */}
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
                organizerDragActive
                  ? "border-blue-400 bg-blue-50"
                  : shownOrganizerImage
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
                  onOrganizerImageChange(file);
                } else if (file) {
                  toast.error("Please select a valid image file.");
                }
              }}
              onClick={() =>
                document.getElementById("organizer_image_upload")?.click()
              }
              style={{ minHeight: 120 }}
            >
              {shownOrganizerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shownOrganizerImage}
                  alt="Organizer"
                  className="max-h-32 mb-2 rounded object-cover"
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
                  document
                    .getElementById("organizer_image_upload")
                    ?.click();
                }}
              >
                {shownOrganizerImage ? "Replace Image" : "Choose Organizer Image"}
              </Button>
              {shownOrganizerImage && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrganizerImagePreview(null);
                    setRemoveOrganizerImage(true);
                  }}
                >
                  Remove Image
                </Button>
              )}
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
                  } else if (file) {
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

          {/* Description */}
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
          </div>

          {/* Optional video embed (YouTube/Vimeo) */}
          <div>
            <Label
              htmlFor="video_url"
              className="text-base font-semibold tracking-tight"
            >
              Video (optional)
            </Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="rounded mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add a YouTube or Vimeo link and it will be embedded on your pool
              page. Clear the field to remove the video.
            </p>
          </div>

          {/* Due date & expected weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-200">
            <div className="flex-1">
              <Label
                htmlFor="due_date"
                className="text-base font-semibold tracking-tight"
              >
                Expected Due Date
              </Label>
              <DatePicker
                id="due_date"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select the expected due date"
                className="mt-2"
              />
              <input type="hidden" name="due_date" value={dueDate} required />
              <p className="text-xs text-muted-foreground mt-1">
                This shifts the center of the date pricing curve for future
                guesses.
              </p>
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
              <input
                type="hidden"
                name="mu_weight_ounces"
                value={
                  Math.floor(muWeight) * 16 + Math.round((muWeight % 1) * 16)
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-8 pt-0 flex gap-4">
        <Button
          type="submit"
          size="lg"
          className="flex-1 text-lg"
          disabled={isPending}
          aria-disabled={isPending}
        >
          {isPending ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
