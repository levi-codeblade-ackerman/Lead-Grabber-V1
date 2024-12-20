<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { toast } from "svelte-sonner";
    import { pb } from '$lib/pocketbase';
    import { Pencil, Trash2 } from 'lucide-svelte';

    let { data } = $props();
    let contacts = data.contacts;
    
    // Dialog state
    let showEditDialog = $state(false);
    let editingContact = $state({
        name: '',
        email: '',
        phone: '',
        id: ''
    });

    async function handleEditContact(contact: any) {
        editingContact = { 
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            id: contact.id
        };
        showEditDialog = true;
    }

    async function handleUpdateContact() {
        try {
            const updatedContact = await pb.collection('contacts').update(editingContact.id, {
                name: editingContact.name,
                email: editingContact.email,
                phone: editingContact.phone,
                updated: new Date().toISOString()
            });

            contacts = contacts.map(c => 
                c.id === updatedContact.id ? updatedContact : c
            );

            showEditDialog = false;
            toast.success('Contact updated successfully');
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error('Failed to update contact');
        }
    }

    function handleDeleteContact(contactId: string) {
        const form = new FormData();
        form.append('contactId', contactId);
        
        fetch('?/deleteContact', {
            method: 'POST',
            body: form
        }).then(async (res) => {
            if (res.ok) {
                contacts = contacts.filter(c => c.id !== contactId);
                toast.success('Contact deleted successfully');
            } else {
                toast.error('Failed to delete contact');
            }
        });
    }
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="flex justify-between items-center">
        <h1 class="font-semibold text-2xl">Contacts</h1>
    </div>
    
    <div class="grid grid-cols-[2fr_1fr_2fr_100px] gap-4 bg-white rounded-lg px-6 py-4 text-lg font-normal leading-8">
        <div>Name</div>
        <div>Phone #</div>
        <div>Email</div>
        <div>Actions</div>
    </div>

    <div class="flex-1 bg-white rounded-xl p-6">
        <div class="flex flex-col divide-y">
            {#each contacts as contact}
                <div class="grid grid-cols-[2fr_1fr_2fr_100px] gap-4 items-center py-4">
                    <div class="font-medium">{contact.name || 'Anonymous'}</div>
                    <div>{contact.phone || '-'}</div>
                    <div>{contact.email || '-'}</div>
                    <div class="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onclick={() => handleEditContact(contact)}
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onclick={() => handleDeleteContact(contact.id)}
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<Dialog.Root bind:open={showEditDialog}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Edit Contact</Dialog.Title>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input id="name" bind:value={editingContact.name} />
            </div>
            <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" bind:value={editingContact.email} />
            </div>
            <div class="grid gap-2">
                <Label for="phone">Phone</Label>
                <Input id="phone" type="tel" bind:value={editingContact.phone} />
            </div>
        </div>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => showEditDialog = false}>
                Cancel
            </Button>
            <Button onclick={handleUpdateContact}>
                Save changes
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>