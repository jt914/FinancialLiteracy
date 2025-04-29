<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isVisible" class="modal-overlay" @click.self="closeOnBackdrop && $emit('close')">
        <div class="modal-container" :class="[modalSize]">
          <div class="modal-header">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ title }}</h3>
            <button @click="$emit('close')" class="modal-close">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch, computed, ref } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'large'].includes(value)
  }
});

const emits = defineEmits(['close']);

// Use a computed property to handle the visibility
const isVisible = computed(() => props.show);

// Map 'large' to 'lg' for backward compatibility
const modalSize = computed(() => {
  if (props.size === 'large') return 'lg';
  return props.size;
});

// Handle escape key press to close modal
const handleEscKey = (event) => {
  if (event.key === 'Escape' && isVisible.value) {
    event.preventDefault();
    document.activeElement.blur();
    emits('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscKey);
  updateBodyOverflow();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey);
  // Ensure we restore body scroll when component is unmounted
  document.body.style.overflow = '';
});

// Update body overflow to prevent scrolling behind modal
const updateBodyOverflow = () => {
  if (process.client) {
    document.body.style.overflow = isVisible.value ? 'hidden' : '';
  }
};

// Watch for changes in show prop to toggle body scroll
watch(() => props.show, () => {
  updateBodyOverflow();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  overflow-y: auto;
  padding: 1rem;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  width: 100%;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.sm {
  max-width: 24rem;
}

.md {
  max-width: 32rem;
}

.lg {
  max-width: 48rem;
}

.xl {
  max-width: 64rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
}

.modal-close {
  color: #9CA3AF;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.modal-close:hover {
  background-color: rgba(243, 244, 246, 1);
  color: rgba(107, 114, 128, 1);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1 1 auto;
}

.modal-footer {
  border-top: 1px solid rgba(209, 213, 219, 1);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style> 