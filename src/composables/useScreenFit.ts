import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export function useScreenFit() {
  const viewport = ref({ width: window.innerWidth, height: window.innerHeight })

  const update = () => {
    viewport.value = { width: window.innerWidth, height: window.innerHeight }
  }

  onMounted(() => window.addEventListener('resize', update))
  onBeforeUnmount(() => window.removeEventListener('resize', update))

  const scale = computed(() =>
    Math.min(viewport.value.width / DESIGN_WIDTH, viewport.value.height / DESIGN_HEIGHT),
  )

  const canvasStyle = computed(() => ({
    width: `${DESIGN_WIDTH}px`,
    height: `${DESIGN_HEIGHT}px`,
    transform: `translate(-50%, -50%) scale(${scale.value})`,
  }))

  return { canvasStyle }
}
