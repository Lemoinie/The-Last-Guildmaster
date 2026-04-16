<script lang="ts">
  interface Props {
    message: string
  }
  let { message }: Props = $props()
</script>

<div class="toast glass-panel success" style="position: fixed; bottom: 20px; right: 20px; z-index: 2000; animation: slideIn 0.3s ease;">
    {message}
</div>
