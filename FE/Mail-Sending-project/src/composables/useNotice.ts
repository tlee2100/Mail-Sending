import { ref } from "vue";

export type NoticeTone = "info" | "success" | "error";

export function useNotice(timeoutMs = 3200) {
  const message = ref("");
  const tone = ref<NoticeTone>("info");
  let timer: number | null = null;

  function clear() {
    message.value = "";
    if (timer !== null && typeof window !== "undefined") {
      window.clearTimeout(timer);
    }
    timer = null;
  }

  function show(nextMessage: string, nextTone: NoticeTone = "info") {
    message.value = nextMessage;
    tone.value = nextTone;
    if (typeof window !== "undefined") {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        message.value = "";
        timer = null;
      }, timeoutMs);
    }
  }

  return {
    message,
    tone,
    clear,
    show,
  };
}
