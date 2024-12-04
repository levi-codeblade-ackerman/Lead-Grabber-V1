export const load = async ({ locals }) => {
   console.log('locals', locals.user);
    return {
        user: locals.user
    };
};