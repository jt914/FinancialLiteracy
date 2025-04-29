import { ref, readonly } from 'vue';

const toasts = ref([]);
let toastId = 0;

const addToast = (message, type = 'info', duration = 3000) => {
  const id = toastId++;
  toasts.value.push({ id, message, type });

  if (duration) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(toast => toast.id !== id);
};

export const useToasts = () => {
  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
  };
}; 