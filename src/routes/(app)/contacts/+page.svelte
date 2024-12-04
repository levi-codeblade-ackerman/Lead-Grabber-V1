<script>
	import EditContact from "$lib/components/edit-contact.svelte";
    // Contact data
    const contacts = [
        {
            name: "Rory Dredhart",
            phone: "(705) 264-2251",
            email: "r.dredhart@canadiantradex.com"
        },
        {
            name: "Chris George",
            phone: "(705) 124-5321",
            email: "ChrisGeorge@gmail.com"
        },
        {
            name: "Jake Paul",
            phone: "(705) 123-1233",
            email: "Jake Paul@yahoo.com"
        },
        {
            name: "Eva Elfie",
            phone: "(705) 978-9786",
            email: "EvaElfie_ph@fansonly.com"
        }
    ];
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="h1 font-semibold text-2xl">Contacts</div>
    
    <div class="grid grid-cols-[2fr_1fr_2fr_80px] gap-4 bg-white rounded-lg px-6 py-4 text-lg font-normal leading-8">
        <div>Name</div>
        <div>Phone #</div>
        <div>Email</div>
        <div>Edit</div>
    </div>

    <div class="flex-1 bg-white rounded-xl p-6">
    
        <div class="flex flex-col divide-y">
            {#each contacts as contact}
                <div class="grid grid-cols-[2fr_1fr_2fr_80px] gap-4 items-center py-4">
                    <div class="font-medium">{contact.name}</div>
                    <div>{contact.phone}</div>
                    <div>{contact.email}</div>
                    <div>
                        <EditContact />
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>