# Svelte 5 Runes Quick Reference Card

## Basic Conversion Pattern

```svelte
<!-- BEFORE -->
<script lang="ts">
  export let name: string = 'World';
</script>

<!-- AFTER -->
<script lang="ts">
  let { name = 'World' } = $props<{ name?: string }>();
</script>
```

## Two-Way Binding

```svelte
<!-- Use $bindable() for props that are bound with bind: -->
<script lang="ts">
  let { value = $bindable('') } = $props<{ value?: string }>();
</script>
```

## Events

```svelte
<!-- BEFORE -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function handleClick() {
    dispatch('click', data);
  }
</script>
<button on:click={handleClick}>Click</button>

<!-- AFTER -->
<script lang="ts">
  let { onclick } = $props<{
    onclick?: (data: any) => void
  }>();
  function handleClick() {
    onclick?.(data);
  }
</script>
<button onclick={handleClick}>Click</button>
```

## Rest Props

```svelte
<!-- BEFORE -->
<div {...$$restProps}>

<!-- AFTER -->
<script lang="ts">
  let { ...restProps } = $props<{ [key: string]: any }>();
</script>
<div {...restProps}>
```

## Event Handler Renaming

| Old | New |
|-----|-----|
| `on:click` | `onclick` |
| `on:input` | `oninput` |
| `on:change` | `onchange` |
| `on:submit` | `onsubmit` |
| `on:keydown` | `onkeydown` |
| `on:focus` | `onfocus` |
| `on:blur` | `onblur` |

## Checklist Per File

- [ ] Remove all `export let` statements
- [ ] Add `$props<Types>()` destructuring
- [ ] Use `$bindable()` for two-way bound props
- [ ] Remove `createEventDispatcher` import
- [ ] Replace `dispatch()` calls with `onEvent?.()`
- [ ] Add event handler props to type definition
- [ ] Change `on:event` to `onevent` in template
- [ ] Change `$$restProps` to `restProps`
- [ ] Run `yarn check` to verify
- [ ] Test in browser

## Common Props That Need $bindable()

- `value`
- `checked`
- `selected`
- `isOpen`
- `expanded`
- `activeTab`

Anything that's mutated inside the component OR used with `bind:` in parent!
