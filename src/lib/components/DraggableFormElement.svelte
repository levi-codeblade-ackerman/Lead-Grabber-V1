<script lang="ts">
  import { Type, Trash2, MapPin, List, ChevronDown, Plus, Phone, Mail, MessageSquare } from 'lucide-svelte';
  import type { FormElement } from '$lib/stores/formElements';
  
  export let element: FormElement;
  export let onDelete: (id: string) => void;
  export let onUpdate: (id: string, updates: Partial<FormElement>) => void;
  
  let dragging = false;
  let newOption = '';

  function addOption() {
    if (newOption.trim()) {
      const options = [...(element.options || []), newOption.trim()];
      onUpdate(element.id, { options });
      newOption = '';
    }
  }

  function removeOption(index: number) {
    const options = (element.options || []).filter((_, i) => i !== index);
    onUpdate(element.id, { options });
  }

  const iconMap = {
    text: Type,
    phone: Phone,
    email: Mail,
    message: MessageSquare,
    address: MapPin,
    multiselect: List,
    dropdown: ChevronDown
  };
</script>

<div
  class="flex flex-col gap-4 p-4 border rounded-lg cursor-move"
  draggable={!element.isDefault}
  ondragstart={() => dragging = true}
  ondragend={() => dragging = false}
  class:opacity-50={dragging}
  data-element-id={element.id}
>
  <div class="flex items-center gap-4">
    <svelte:component this={iconMap[element.type]} class="h-5 w-5 text-gray-500" />
    <div class="flex-1">
      <input 
        type="text" 
        class="w-full border-none bg-transparent focus:outline-none"
        placeholder={element.label}
        value={element.value}
        oninput={(e) => onUpdate(element.id, { value: e.currentTarget.value })}
      />
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-500">Required</label>
      <input 
        type="checkbox" 
        checked={element.required}
        onchange={(e) => onUpdate(element.id, { required: e.currentTarget.checked })}
        class="rounded border-gray-300 bg-white" 
      />
      {#if !element.isDefault}
        <button 
          class="text-red-500 hover:text-red-700"
          onclick={() => onDelete(element.id)}
        >
          <Trash2 class="h-4 w-4" />
        </button>
      {/if}
    </div>
  </div>

  {#if element.type === 'multiselect' || element.type === 'dropdown'}
    <div class="mt-2 space-y-2">
      <div class="flex gap-2">
        <input
          type="text"
          class="flex-1 px-2 py-1 border rounded bg-white"
          placeholder="Add option"
          bind:value={newOption}
          onkeydown={(e) => e.key === 'Enter' && addOption()}
        />
        <button
          class="px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
          onclick={addOption}
        >
          <Plus class="h-4 w-4" />
        </button>
      </div>
      
      <div class="space-y-1">
        {#each element.options || [] as option, i}
          <div class="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded">
            <span class="flex-1">{option}</span>
            <button
              class="text-red-500 hover:text-red-700"
              onclick={() => removeOption(i)}
            >
              <Trash2 class="h-3 w-3" />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div> 