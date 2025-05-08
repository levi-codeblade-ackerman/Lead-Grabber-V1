<script lang="ts">
  import { Button } from "$lib/components/ui/button/index";
  import { toast } from "svelte-sonner";
  import { Phone, X, MicOff, Volume2, Delete } from "lucide-svelte";
  
  let phoneNumber = $state('');
  let isDialing = $state(false);
  let isCallActive = $state(false);
  let callId = $state('');
  let callStatus = $state('');
  
  // Optional client ID for tracking purposes
  let clientId = "test-client";
  
  async function initiateCall() {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    isDialing = true;
    callStatus = 'Dialing...';
    
    try {
      const response = await fetch('/api/telnyx/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          from: '+17059800835', // Your Telnyx number
          clientId: clientId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Call initiated');
        callId = result.callId;
        isCallActive = true;
        callStatus = 'Connected';
      } else {
        toast.error('Failed to place call: ' + result.error);
        callStatus = 'Failed';
      }
    } catch (error) {
      console.error('Call error:', error);
      toast.error('Error placing call');
      callStatus = 'Error';
    } finally {
      isDialing = false;
    }
  }
  
  function hangup() {
    if (!callId) return;
    
    callStatus = 'Hanging up...';
    
    fetch('/api/telnyx/hangup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        toast.success('Call ended');
      } else {
        toast.error('Failed to hang up: ' + result.error);
      }
    })
    .catch(error => {
      console.error('Hangup error:', error);
      toast.error('Error hanging up call');
    })
    .finally(() => {
      isCallActive = false;
      callId = '';
      callStatus = '';
    });
  }
  
  function appendDigit(digit: string) {
    phoneNumber += digit;
  }
  
  function deleteDigit() {
    phoneNumber = phoneNumber.slice(0, -1);
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Call Dialer</h1>
  
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="mb-4">
      <label class="block text-gray-700 font-medium mb-2" for="phoneNumber">
        Phone Number
      </label>
      <input
        id="phoneNumber"
        bind:value={phoneNumber}
        class="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type="tel"
        placeholder="+1 (555) 123-4567"
      />
    </div>
    
    <!-- Dialer Pad -->
    <div class="mb-6">
      <div class="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#', '+'] as digit}
          <button 
            onclick={() => appendDigit(digit.toString())}
            class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-lg text-xl"
          >
            {digit}
          </button>
        {/each}
        <button 
          onclick={deleteDigit}
          class="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-4 px-6 rounded-lg text-xl col-span-3 mt-2 flex items-center justify-center"
        >
          <Delete class="h-5 w-5 mr-2" />
          Delete
        </button>
      </div>
    </div>
    
    <div class="flex justify-center">
      {#if !isCallActive}
        <Button 
          onclick={initiateCall}
          disabled={isDialing}
          class="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full"
        >
          <Phone class="h-5 w-5 mr-2" />
          {isDialing ? 'Dialing...' : 'Call'}
        </Button>
      {:else}
        <div class="flex gap-4">
          <Button 
            onclick={() => {}}
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full"
          >
            <MicOff class="h-5 w-5" />
          </Button>
          
          <Button 
            onclick={() => {}}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full"
          >
            <Volume2 class="h-5 w-5" />
          </Button>
          
          <Button 
            onclick={hangup}
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full"
          >
            <X class="h-5 w-5" />
          </Button>
        </div>
      {/if}
    </div>
    
    {#if callStatus}
      <div class="mt-4 text-center">
        <p class="text-gray-700">Call Status: <span class="font-medium">{callStatus}</span></p>
      </div>
    {/if}
  </div>
</div> 