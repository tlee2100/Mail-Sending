<template>
  <section class="ai-media-generator">
    <div class="ai-media-generator__head">
      <h2 class="ai-media-generator__title">AI Media</h2>
      <div class="ai-media-generator__tabs" role="tablist" aria-label="AI media tabs">
        <button
          type="button"
          class="ai-media-generator__tab"
          :class="{ 'ai-media-generator__tab--active': activeTab === 'image' }"
          @click="activeTab = 'image'"
        >
          Ảnh AI
        </button>
        <button
          type="button"
          class="ai-media-generator__tab"
          :class="{ 'ai-media-generator__tab--active': activeTab === 'video' }"
          @click="activeTab = 'video'"
        >
          Video AI
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'image'" class="ai-media-generator__body">
      <div class="ai-media-generator__form">
        <div class="input-wrap">
          <label>Prompt</label>
          <textarea
            v-model="imagePrompt"
            rows="5"
            minlength="10"
            placeholder="Mô tả hình ảnh cần tạo cho email"
          ></textarea>
        </div>

        <div class="input-wrap">
          <label>Alt text</label>
          <input
            v-model="imageAltText"
            type="text"
            placeholder="Mô tả ngắn cho ảnh"
          />
        </div>

        <div class="ai-media-generator__options">
          <div class="input-wrap">
            <label>Size</label>
            <select v-model="imageSize">
              <option
                v-for="option in imageSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="input-wrap">
            <label>Email width</label>
            <input
              v-model.number="imageEmailWidth"
              type="number"
              min="120"
              max="1200"
              step="10"
            />
          </div>
        </div>

        <button
          type="button"
          class="btn btn--primary ai-media-generator__action"
          :disabled="isGeneratingImage || !isImagePromptValid"
          @click="handleGenerateImage"
        >
          {{ isGeneratingImage ? "Đang tạo ảnh..." : "Tạo ảnh" }}
        </button>

        <p v-if="imageError" class="notice notice--error">
          {{ imageError }}
        </p>
      </div>

      <div class="ai-media-generator__preview">
        <div class="ai-media-generator__preview-box">
          <img
            v-if="imageResult?.url"
            class="ai-media-generator__image"
            :src="imageResult.url"
            :alt="imageResult.altText || imageAltText || 'AI image preview'"
          />
          <div v-else class="ai-media-generator__empty">Chưa có ảnh</div>
        </div>

        <div v-if="imageResult" class="ai-media-generator__result-meta">
          <span>{{ imageResult.filename }}</span>
          <a :href="imageResult.url" target="_blank" rel="noreferrer">Mở ảnh</a>
        </div>

        <button
          type="button"
          class="btn btn--secondary ai-media-generator__insert"
          :disabled="!imageResult"
          @click="handleInsertImage"
        >
          Chèn vào email
        </button>
      </div>
    </div>

    <div v-else class="ai-media-generator__body">
      <div class="ai-media-generator__form">
        <div class="input-wrap">
          <label>Prompt</label>
          <textarea
            v-model="videoPrompt"
            rows="5"
            minlength="10"
            placeholder="Mô tả video cần tạo cho email"
          ></textarea>
        </div>

        <div class="ai-media-generator__options">
          <div class="input-wrap">
            <label>Size</label>
            <select v-model="videoSize">
              <option
                v-for="option in videoSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="input-wrap">
            <label>Seconds</label>
            <input
              v-model.number="videoSeconds"
              type="number"
              min="1"
              max="20"
              step="1"
            />
          </div>
        </div>

        <button
          type="button"
          class="btn btn--primary ai-media-generator__action"
          :disabled="isVideoBusy || !isVideoPromptValid"
          @click="handleCreateVideo"
        >
          {{ isVideoBusy ? "Đang tạo video..." : "Tạo video" }}
        </button>

        <div v-if="videoJob || videoStatus" class="ai-media-generator__status">
          <div class="ai-media-generator__status-row">
            <span>Status</span>
            <strong>{{ currentVideoStatus || "queued" }}</strong>
          </div>
          <div class="ai-media-generator__progress" aria-label="Video progress">
            <span :style="{ width: `${videoProgress}%` }"></span>
          </div>
          <div class="ai-media-generator__status-row">
            <span>Progress</span>
            <strong>{{ videoProgress }}%</strong>
          </div>
        </div>

        <p v-if="videoInfo" class="notice notice--info">
          {{ videoInfo }}
        </p>
        <p v-if="videoError" class="notice notice--error">
          {{ videoError }}
        </p>
      </div>

      <div class="ai-media-generator__preview">
        <div class="ai-media-generator__preview-box">
          <video
            v-if="videoDownload?.url"
            class="ai-media-generator__video"
            :src="videoDownload.url"
            controls
          ></video>
          <div v-else class="ai-media-generator__empty">Chưa có video</div>
        </div>

        <div v-if="videoDownload?.url" class="ai-media-generator__result-meta">
          <span>Video đã sẵn sàng</span>
          <a :href="videoDownload.url" target="_blank" rel="noreferrer">Mở video</a>
        </div>

        <button
          type="button"
          class="btn btn--secondary ai-media-generator__insert"
          :disabled="!videoDownload?.emailHtml"
          @click="handleInsertVideo"
        >
          Chèn vào email
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import {
  createVideo,
  downloadVideo,
  generateImage,
  getVideoStatus,
  type AiImageResult,
  type AiImageSize,
  type AiVideoDownload,
  type AiVideoJob,
  type AiVideoSize,
  type AiVideoStatus,
} from "../api/aiMediaApi";

type ImageInsertPayload = AiImageResult & {
  emailWidth: number;
};

type HtmlInsertPayload = {
  type: "video";
  html: string;
  url?: string;
};

const props = withDefaults(
  defineProps<{
    token?: string | null;
  }>(),
  {
    token: null,
  },
);

const emit = defineEmits<{
  "insert-image": [payload: ImageInsertPayload];
  "insert-html": [payload: HtmlInsertPayload];
}>();

const imageSizeOptions: Array<{ value: AiImageSize; label: string }> = [
  { value: "1024x1024", label: "1024 x 1024" },
  { value: "1024x1536", label: "1024 x 1536" },
  { value: "1536x1024", label: "1536 x 1024" },
  { value: "auto", label: "Auto" },
];

const videoSizeOptions: Array<{ value: AiVideoSize; label: string }> = [
  { value: "720x1280", label: "720 x 1280" },
  { value: "1280x720", label: "1280 x 720" },
  { value: "1024x1792", label: "1024 x 1792" },
  { value: "1792x1024", label: "1792 x 1024" },
];

const activeTab = ref<"image" | "video">("image");

const imagePrompt = ref("");
const imageAltText = ref("");
const imageSize = ref<AiImageSize>("1024x1024");
const imageEmailWidth = ref(600);
const imageResult = ref<AiImageResult | null>(null);
const imageError = ref("");
const isGeneratingImage = ref(false);

const videoPrompt = ref("");
const videoSize = ref<AiVideoSize>("1280x720");
const videoSeconds = ref(8);
const videoJob = ref<AiVideoJob | null>(null);
const videoStatus = ref<AiVideoStatus | null>(null);
const videoDownload = ref<AiVideoDownload | null>(null);
const videoError = ref("");
const videoInfo = ref("");
const isCreatingVideo = ref(false);
const isPollingVideo = ref(false);
const isDownloadingVideo = ref(false);
let videoStatusTimer: number | undefined;
let videoDownloadTimer: number | undefined;

const isImagePromptValid = computed(() => imagePrompt.value.trim().length >= 10);
const isVideoPromptValid = computed(() => videoPrompt.value.trim().length >= 10);
const isVideoProcessing = computed(
  () => !!videoJob.value && !videoDownload.value?.emailHtml && !videoError.value,
);
const isVideoBusy = computed(
  () =>
    isCreatingVideo.value ||
    isPollingVideo.value ||
    isDownloadingVideo.value ||
    isVideoProcessing.value,
);

const currentVideoStatus = computed(
  () => videoStatus.value?.status || videoJob.value?.status || "",
);

const videoProgress = computed(() => {
  const raw = Number(videoStatus.value?.progress ?? videoJob.value?.progress ?? 0);
  if (!Number.isFinite(raw)) return 0;
  const normalized = raw > 0 && raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
});

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizedImageWidth() {
  const width = clamp(Number(imageEmailWidth.value), 120, 1200, 600);
  imageEmailWidth.value = width;
  return width;
}

function normalizedVideoSeconds() {
  const seconds = clamp(Number(videoSeconds.value), 1, 20, 8);
  videoSeconds.value = seconds;
  return seconds;
}

function clearVideoTimers() {
  if (videoStatusTimer !== undefined) {
    window.clearTimeout(videoStatusTimer);
    videoStatusTimer = undefined;
  }
  if (videoDownloadTimer !== undefined) {
    window.clearTimeout(videoDownloadTimer);
    videoDownloadTimer = undefined;
  }
}

async function handleGenerateImage() {
  imageError.value = "";
  if (!isImagePromptValid.value) {
    imageError.value = "Prompt cần tối thiểu 10 ký tự.";
    return;
  }

  isGeneratingImage.value = true;
  try {
    imageResult.value = await generateImage(
      {
        prompt: imagePrompt.value.trim(),
        altText: imageAltText.value.trim() || undefined,
        size: imageSize.value,
        emailWidth: normalizedImageWidth(),
      },
      props.token,
    );
  } catch (error) {
    imageError.value = getErrorMessage(error, "Không thể tạo ảnh.");
  } finally {
    isGeneratingImage.value = false;
  }
}

async function handleCreateVideo() {
  videoError.value = "";
  videoInfo.value = "";
  if (!isVideoPromptValid.value) {
    videoError.value = "Prompt cần tối thiểu 10 ký tự.";
    return;
  }

  clearVideoTimers();
  videoJob.value = null;
  videoStatus.value = null;
  videoDownload.value = null;
  isCreatingVideo.value = true;

  try {
    const job = await createVideo(
      {
        prompt: videoPrompt.value.trim(),
        size: videoSize.value,
        seconds: normalizedVideoSeconds(),
      },
      props.token,
    );

    if (!job.id) {
      throw new Error("API không trả về video id.");
    }

    videoJob.value = job;
    videoInfo.value = "Video đang được xử lý.";
    void pollVideoStatus(job.id);
  } catch (error) {
    videoError.value = getErrorMessage(error, "Không thể tạo video.");
  } finally {
    isCreatingVideo.value = false;
  }
}

function scheduleVideoStatusPoll(videoId: string) {
  videoStatusTimer = window.setTimeout(() => {
    void pollVideoStatus(videoId);
  }, 4000);
}

async function pollVideoStatus(videoId: string) {
  isPollingVideo.value = true;
  try {
    const status = await getVideoStatus(videoId, props.token);
    videoStatus.value = status;
    const normalizedStatus = String(status.status || "").toLowerCase();

    if (normalizedStatus === "completed") {
      videoInfo.value = "Video đã hoàn tất, đang chuẩn bị link.";
      await fetchVideoDownload(videoId);
      return;
    }

    if (
      normalizedStatus === "failed" ||
      normalizedStatus === "error" ||
      normalizedStatus === "cancelled"
    ) {
      videoError.value = status.error || "Tạo video thất bại.";
      return;
    }

    scheduleVideoStatusPoll(videoId);
  } catch (error) {
    videoError.value = getErrorMessage(error, "Không thể kiểm tra trạng thái video.");
  } finally {
    isPollingVideo.value = false;
  }
}

function scheduleVideoDownload(videoId: string) {
  videoDownloadTimer = window.setTimeout(() => {
    void fetchVideoDownload(videoId);
  }, 4000);
}

async function fetchVideoDownload(videoId: string) {
  isDownloadingVideo.value = true;
  try {
    const result = await downloadVideo(videoId, props.token);
    videoDownload.value = result;
    if (result.ready && result.emailHtml) {
      videoInfo.value = "Video đã sẵn sàng.";
      return;
    }
    videoInfo.value = "Video đã hoàn tất, đang chuẩn bị file.";
    scheduleVideoDownload(videoId);
  } catch (error) {
    videoError.value = getErrorMessage(error, "Không thể tải video.");
  } finally {
    isDownloadingVideo.value = false;
  }
}

function handleInsertImage() {
  if (!imageResult.value) return;
  emit("insert-image", {
    ...imageResult.value,
    emailWidth: normalizedImageWidth(),
  });
}

function handleInsertVideo() {
  if (!videoDownload.value?.emailHtml) return;
  emit("insert-html", {
    type: "video",
    html: videoDownload.value.emailHtml,
    url: videoDownload.value.url,
  });
}

onBeforeUnmount(() => {
  clearVideoTimers();
});
</script>

<style scoped>
.ai-media-generator {
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-bg-surface-elevated);
  padding: 16px;
}

.ai-media-generator__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.ai-media-generator__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-main);
}

.ai-media-generator__tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-control-bg-muted);
}

.ai-media-generator__tab {
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  background: var(--color-transparent);
  color: var(--color-text-muted);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.ai-media-generator__tab--active {
  background: var(--color-control-bg);
  color: var(--color-text-main);
  box-shadow: 0 1px 2px var(--shadow-control-color);
}

.ai-media-generator__body {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(280px, 1.1fr);
  gap: 16px;
  align-items: stretch;
}

.ai-media-generator__form,
.ai-media-generator__preview {
  min-width: 0;
}

.ai-media-generator__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ai-media-generator__action,
.ai-media-generator__insert {
  width: 100%;
  justify-content: center;
}

.ai-media-generator__preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-media-generator__preview-box {
  min-height: 260px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-bg-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ai-media-generator__image,
.ai-media-generator__video {
  width: 100%;
  height: 100%;
  max-height: 320px;
  object-fit: contain;
  background: var(--color-white);
}

.ai-media-generator__empty {
  color: var(--color-text-muted);
  font-size: 13px;
}

.ai-media-generator__result-meta,
.ai-media-generator__status-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.ai-media-generator__result-meta a {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.ai-media-generator__status {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-bg-surface-soft);
}

.ai-media-generator__status-row strong {
  color: var(--color-text-main);
}

.ai-media-generator__progress {
  height: 8px;
  margin: 10px 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-slate-bg);
}

.ai-media-generator__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.25s ease;
}

@media (max-width: 900px) {
  .ai-media-generator__body,
  .ai-media-generator__options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .ai-media-generator__head {
    align-items: stretch;
    flex-direction: column;
  }

  .ai-media-generator__tabs {
    width: 100%;
  }
}
</style>
