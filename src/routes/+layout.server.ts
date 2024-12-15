export const ssr = false;
export const load = async ({ locals }) => {
   console.log('locals', locals.user);
    return {
        user: locals.user
    };
};