<script lang="ts">
  interface Props {
    title: string
  }
  let { title }: Props = $props()
</script>

<div class="view-header">
  <h2 class="view-title">{title}</h2>
  <p class="view-description">This building is currently under construction...</p>
</div>
