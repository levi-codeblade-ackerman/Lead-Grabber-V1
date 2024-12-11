import { pb } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import type { LeadForm } from '$lib/types/leadform';

export async function GET({ params, request, locals }) {
  try {
    pb.authStore.clear();

    const form = await pb.collection('leadforms').getOne<LeadForm>(
      params.id,
      {
        $autoCancel: false,
        requestKey: null,
        fields: 'id,form_data'
      }
    );

    if (!form) {
      throw error(404, 'Form not found');
    }

    const formData = typeof form.form_data === 'string' 
      ? JSON.parse(form.form_data)
      : form.form_data;

    const jsCode = `
      (function() {
        const formData = ${JSON.stringify(formData)};
        
        function addStyles() {
          const style = document.createElement('style');
          style.textContent = \`
            .clearsky-form {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 32rem;
              margin: 0 auto;
              padding: 1.5rem;
            }
            .clearsky-form h2 {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
            }
            .clearsky-form p {
              color: #6B7280;
              margin-bottom: 1.5rem;
            }
            .clearsky-form-fields {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }
            .clearsky-input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #E5E7EB;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            }
            .clearsky-input:focus {
              outline: 2px solid ${formData.settings.buttonColor};
              outline-offset: 2px;
            }
            .clearsky-button {
              width: 100%;
              padding: 0.75rem;
              background-color: ${formData.settings.buttonColor};
              color: white;
              border: none;
              border-radius: 0.375rem;
              font-weight: 500;
              cursor: pointer;
              transition: opacity 0.2s;
            }
            .clearsky-button:hover {
              opacity: 0.9;
            }
            .clearsky-terms {
              margin-top: 1rem;
              text-align: center;
              font-size: 0.75rem;
              color: #6B7280;
            }
          \`;
          document.head.appendChild(style);
        }

        function createForm() {
          const container = document.createElement('div');
          container.id = 'clearsky-form-${params.id}';
          container.className = 'clearsky-form';
          
          const formHtml = \`
            <h2>\${formData.settings.heading}</h2>
            <p>\${formData.settings.intro}</p>
            <form id="clearsky-form" onsubmit="handleSubmit(event)" class="clearsky-form-fields">
              \${formData.formElements.map(element => {
                if (element.type === 'text' || element.type === 'phone' || element.type === 'email') {
                  return \`
                    <input 
                      type="\${element.type === 'email' ? 'email' : 'text'}"
                      name="\${element.id}"
                      placeholder="\${element.label}"
                      class="clearsky-input"
                      \${element.required ? 'required' : ''}
                    />
                  \`;
                } else if (element.type === 'message' || element.type === 'address') {
                  return \`
                    <textarea 
                      name="\${element.id}"
                      placeholder="\${element.label}"
                      class="clearsky-input"
                      style="min-height: 100px;"
                      \${element.required ? 'required' : ''}
                    ></textarea>
                  \`;
                } else if (element.type === 'multiselect') {
                  return \`
                    <div>
                      <label class="block mb-2 text-sm font-medium">\${element.label}</label>
                      \${(element.options || []).map(option => \`
                        <label class="flex items-center gap-2 mb-2">
                          <input type="checkbox" name="\${element.id}[]" value="\${option}">
                          <span>\${option}</span>
                        </label>
                      \`).join('')}
                    </div>
                  \`;
                } else if (element.type === 'dropdown') {
                  return \`
                    <select 
                      name="\${element.id}"
                      class="clearsky-input"
                      \${element.required ? 'required' : ''}
                    >
                      <option value="">\${element.label}</option>
                      \${(element.options || []).map(option => \`
                        <option value="\${option}">\${option}</option>
                      \`).join('')}
                    </select>
                  \`;
                }
              }).join('')}
              <div class="text-sm text-gray-500 mb-4 text-center">
                  By submitting, you agree to receive text messages at this mobile number. Message & data rates apply. See our <a 
                      href="\${formData.settings.privacyPolicy.type === 'custom' ? formData.settings.privacyPolicy.link : '/privacy'}" 
                      class="text-primary hover:underline"
                      target="_blank"
                  >
                      privacy policy
                  </a>
              </div>
              <button type="submit" class="clearsky-button">
                \${formData.settings.buttonText}
              </button>
            </form>
          \`;
          
          container.innerHTML = formHtml;
          document.currentScript.parentNode.insertBefore(container, document.currentScript);
          addStyles();
        }

        function handleSubmit(event) {
          event.preventDefault();
          const form = event.target;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);

          // Here you can add the logic to submit the form data to your backend
          console.log('Form submitted:', data);

          // Show success message or redirect
          if (formData.settings.customConfirmation.type === 'custom' && formData.settings.customConfirmation.link) {
            window.location.href = formData.settings.customConfirmation.link;
          } else {
            form.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>Thank you!</h3><p>Your submission has been received.</p></div>';
          }
        }

        window.handleSubmit = handleSubmit;
        createForm();
      })();
    `;

    return new Response(jsCode, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    console.error('Error generating form script:', err);
    return new Response('Error generating form script', {
      status: err.status || 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 