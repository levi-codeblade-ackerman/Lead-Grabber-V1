<script lang="ts">
  import { onMount } from 'svelte';
  
  let from = '+18005551234';
  let text = 'Hello, I\'m a test customer';
  let to = '+17059800835';
  let response = null;
  let loading = false;
  
  async function sendTestMessage() {
    loading = true;
    try {
      const res = await fetch(`/api/telnyx/test-webhook?from=${encodeURIComponent(from)}&text=${encodeURIComponent(text)}&to=${encodeURIComponent(to)}`);
      response = await res.json();
    } catch (err) {
      console.error('Error sending test message:', err);
      response = { success: false, error: err.message };
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto p-4 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Telnyx Webhook Tester</h1>
  
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="mb-4">
      <label class="block text-gray-700 font-medium mb-2" for="from">
        From Phone Number
      </label>
      <input
        id="from"
        bind:value={from}
        class="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type="text"
      />
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-700 font-medium mb-2" for="to">
        To Phone Number
      </label>
      <input
        id="to"
        bind:value={to}
        class="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type="text"
      />
    </div>
    
    <div class="mb-6">
      <label class="block text-gray-700 font-medium mb-2" for="text">
        Message Text
      </label>
      <textarea
        id="text"
        bind:value={text}
        class="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        rows="3"
      ></textarea>
    </div>
    
    <div class="flex items-center justify-between">
      <button
        on:click={sendTestMessage}
        disabled={loading}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button"
      >
        {loading ? 'Sending...' : 'Send Test Message'}
      </button>
    </div>
  </div>
  
  {#if response}
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Response</h2>
      
      <div class="mb-2">
        <span class="font-medium">Status:</span>
        <span class={response.success ? "text-green-600" : "text-red-600"}>
          {response.success ? 'Success' : 'Error'}
        </span>
      </div>
      
      {#if response.status}
        <div class="mb-2">
          <span class="font-medium">HTTP Status:</span> {response.status}
        </div>
      {/if}
      
      {#if response.error}
        <div class="mb-4 p-3 bg-red-100 rounded text-red-800">
          <span class="font-medium">Error:</span> {response.error}
        </div>
      {/if}
      
      {#if response.response}
        <div class="mb-4">
          <span class="font-medium">Webhook Response:</span>
          <pre class="mt-2 p-3 bg-gray-100 rounded overflow-x-auto">{JSON.stringify(response.response, null, 2)}</pre>
        </div>
      {/if}
      
      {#if response.payload}
        <div>
          <span class="font-medium">Request Payload:</span>
          <pre class="mt-2 p-3 bg-gray-100 rounded overflow-x-auto">{JSON.stringify(response.payload, null, 2)}</pre>
        </div>
      {/if}
    </div>
  {/if}
</div> 