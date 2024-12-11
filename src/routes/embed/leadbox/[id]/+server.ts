import { pb } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import type { Leadbox, LeadboxData } from '$lib/types/leadbox';

export async function GET({ params, request, locals }) {
  try {
    pb.authStore.clear();

    const leadbox = await pb.collection('leadboxes').getOne<Leadbox>(
      params.id,
      {
        $autoCancel: false,
        requestKey: null,
        fields: 'id,leadbox_data'
      }
    );
    console.log(leadbox);

    if (!leadbox) {
      throw error(404, 'Leadbox not found');
    }

    const leadboxData: LeadboxData = typeof leadbox.leadbox_data === 'string' 
      ? JSON.parse(leadbox.leadbox_data)
      : leadbox.leadbox_data;

    const jsCode = `
      (function() {
        const leadboxData = ${JSON.stringify({ ...leadboxData, leadBoxOpen: false })};
        console.log('leadboxData', leadboxData);
        
        function addStyles() {
          const style = document.createElement('style');
          style.textContent = \`
            .clearsky-leadbox {
              font-family: system-ui, -apple-system, sans-serif;
            }
            .clearsky-container {
              font-family: system-ui, -apple-system, sans-serif;
              position: fixed;
              bottom: 1rem;
              right: 1rem;
              z-index: 9999;
            }
            .clearsky-box {
              border: 1px solid #e5e7eb;
              overflow: hidden;
              position: relative;
              width: 517px;
              margin: 0 auto;
              background: #ffffff;
            }
            .clearsky-header {
              background: #3B5BDB;
              color: white;
              padding: 1rem;
              height: 7rem;
              display: flex;
              align-items: center;
            }
            .clearsky-content {
              padding: 1.5rem;
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              position: relative;
            }
            .clearsky-logo {
              display: flex;
              justify-content: center;
              margin-bottom: 1rem;
              position: relative;
            }
            .clearsky-logo img {
              width: 164px;
              height: 82px;
              object-fit: contain;
              position: absolute;
              top: -40px;
              z-index: 10;
            }
            .clearsky-buttons {
              margin-top: 3rem;
              padding: 0 1.25rem;
              background: white;
              padding-top: 1rem;
              padding-bottom: 5rem;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .clearsky-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              white-space: nowrap;
              font-size: 0.875rem;
                            font-weight: 600;
          
              height: 2.5rem;
              padding: 0 1rem;
              width: 100%;
              border-radius: 9999px;
              color: white;
              border: none;
              cursor: pointer;
              transition: opacity 0.2s;
            }
            .clearsky-button:hover {
              opacity: 0.9;
            }
            .clearsky-button:focus-visible {
              outline: 2px solid #3B5BDB;
              outline-offset: 2px;
            }
            .clearsky-button:disabled {
              pointer-events: none;
              opacity: 0.5;
            }
            .clearsky-secondary-button {
              height: 2.5rem;
              padding: 0.5rem 1.5rem;
              background: #3B5BDB;
              color: white;
              border-radius: 0.375rem;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.875rem;
              font-weight: 500;
            }
            .clearsky-toggle-button {
              height: 3.5rem;
              width: 3.5rem;
              border-radius: 9999px;
              background: #3B5BDB;
              color: white;
              border: none;
              padding: 0.5rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .clearsky-terms {
              text-align: center;
              font-size: 0.75rem;
              color: #6B7280;
            }
            .clearsky-animate-in {
              animation: clearsky-slide-in 0.3s ease-out;
            }
            .clearsky-animate-out {
              animation: clearsky-slide-out 0.3s ease-out;
            }
            @keyframes clearsky-slide-in {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes clearsky-slide-out {
              from {
                opacity: 1;
                transform: translateY(0);
              }
              to {
                opacity: 0;
                transform: translateY(20px);
              }
            }
          \`;
          document.head.appendChild(style);
        }

        function createMessageSquareIcon() {
          return \`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          \`;
        }

        function createChannelButton(channel) {
          return \`
            <button 
              class="clearsky-button" 
              type="button" 
              style="background-color: \${channel.buttonColor};"
              onclick="window.open('\${channel.url}', '\${channel.target || '_blank'}')"
            >
              \${channel.showIcon ? createChannelIcon(channel.icon) : ''}
              \${channel.value}
            </button>
          \`;
        }

        function createChannelIcon(iconName) {
          const icons = {
            MessageSquare: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            \`,
            Phone: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            \`,
            Play: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            \`,
            Mail: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            \`,
            Map: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>
              </svg>
            \`,
            Target: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            \`,
            Clock: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            \`,
            Calendar: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
            \`,
            CreditCard: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            \`,
            Search: \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            \`
          };
          
          return icons[iconName] || '';
        }

     

        function createOpenLeadbox() {
          return \`
            <div class="clearsky-box clearsky-animate-in">
              <div class="clearsky-header">
                <p style="font-size: 1.125rem;">Text with us.</p>
              </div>
              <div class="clearsky-content">
                <div class="clearsky-logo">
                  <img 
                      src="\${leadboxData.logoImage}" 
                      alt="Company Logo" 
                      class="w-[164px] h-[82px] object-contain absolute top-[-40px] z-10"
                  />
                </div>
                <div class="clearsky-buttons">
                  \${leadboxData.channels.map(channel => createChannelButton(channel)).join('')}
                </div>
                <div class="clearsky-terms">
                  Use subject to terms • Lead&Terms
                </div>
              </div>
            </div>
            \${leadboxData.secondaryButton ? \`
            <div style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button class="clearsky-secondary-button">
                \${leadboxData.secondaryButton.text}
                \${leadboxData.secondaryButton.showIcon ? createChannelIcon(leadboxData.secondaryButton.icon) : ''}
              </button>
            </div>
            \` : ''}
           \${createClosedLeadbox()}
          \`;
        }

        function createClosedLeadbox() {
          if (leadboxData.primaryIconOnly) {
            return \`
              <div style="margin-top: 1.75rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="clearsky-toggle-button" onclick="toggleLeadbox()">
                  \${createMessageSquareIcon()}
                </button>
              </div>
            \`;
          } else {
            return \`
              <div style="display: flex; flex-direction: column; align-items: center; position: relative; width:fit-content; float:right; margin-top:3rem">
                <div style="height: 3.5rem; position: absolute; top: -22px; width: 100%; border-radius: 1.5rem; z-index: 10; background-color: #3B5BDB; display: flex; justify-content: center;">
                  <p style="color: white; font-size: 0.875rem; padding-left: 1rem; padding-right: 1rem; bottom:23px; position: absolute;">Questions?, just ask</p>
                </div>
                <button 
                  style="background-color: white; height: 3.5rem; padding-left: 5rem; padding-right: 5rem; z-index: 20; border-radius: 9999px; color: #3B5BDB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.125rem; font-weight: 500; border: none; cursor: pointer;"
                  onclick="toggleLeadbox()"
                >
                  TEXT US
                </button>
              </div>
            \`;
          }
        }

        function toggleLeadbox() {
          const container = document.getElementById('clearsky-leadbox-${params.id}');
          const isOpen = container.querySelector('.clearsky-box');
          
          if (isOpen) {
            const content = container.firstElementChild;
            content.classList.add('clearsky-animate-out');
            
            // Wait for animation to complete before removing
            setTimeout(() => {
              container.innerHTML = createClosedLeadbox();
            }, 300);
          } else {
            container.innerHTML = createOpenLeadbox();
            const content = container.querySelector('.clearsky-box');
            if (content) {
              content.classList.add('clearsky-animate-in');
            }
          }
        }

        function createLeadbox() {
          const container = document.createElement('div');
          container.id = 'clearsky-leadbox-${params.id}';
          container.className = 'clearsky-container';
          
          container.innerHTML = createClosedLeadbox();
          
          document.body.appendChild(container);
          addStyles();
          
          window.toggleLeadbox = toggleLeadbox;
        }
        
        createLeadbox();
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
    console.error('Error generating leadbox script:', err);
    return new Response('Error generating leadbox script', {
      status: err.status || 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 