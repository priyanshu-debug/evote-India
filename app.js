// State Management
        const state = {
            currentStep: 1,
            aadhaar: '',
            voterId: '',
            mobile: '',
            selectedParty: null,
            otpVerified: false,
            hasVoted: false,
            sessionToken: null
        };

        // Party Data
        const parties = [
            { id: 'bjp', name: 'Bharatiya Janata Party', symbol: '🪷', color: 'bg-orange-500', leader: 'Leader Name' },
            { id: 'inc', name: 'Indian National Congress', symbol: '✋', color: 'bg-blue-500', leader: 'Leader Name' },
            { id: 'aap', name: 'Aam Aadmi Party', symbol: '🧹', color: 'bg-blue-400', leader: 'Leader Name' },
            { id: 'bsp', name: 'Bahujan Samaj Party', symbol: '🐘', color: 'bg-blue-700', leader: 'Leader Name' },
            { id: 'cpi', name: 'Communist Party of India', symbol: '☭', color: 'bg-red-600', leader: 'Leader Name' },
            { id: 'nota', name: 'None of the Above (NOTA)', symbol: '❌', color: 'bg-gray-500', leader: 'N/A' }
        ];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            renderParties();
            updateProgress();
        });

        // FIXED formatAadhaar function - properly handles 12 digits
        function formatAadhaar(input) {
            // Remove all non-digits first
            let value = input.value.replace(/\D/g, '');
            
            // Limit to 12 digits only
            if (value.length > 12) {
                value = value.slice(0, 12);
            }
            
            // Add spaces every 4 digits for readability
            const parts = value.match(/.{1,4}/g) || [];
            input.value = parts.join(' ');
            
            // Update character counter
            document.getElementById('aadhaar-count').textContent = `${value.length}/12`;
            
            // Visual validation feedback
            if (value.length === 12) {
                input.classList.add('border-green-500', 'bg-green-50');
                input.classList.remove('border-red-500', 'border-blue-400');
            } else if (value.length > 0) {
                input.classList.add('border-blue-400');
                input.classList.remove('border-green-500', 'bg-green-50', 'border-red-500');
            } else {
                input.classList.remove('border-green-500', 'bg-green-50', 'border-red-500', 'border-blue-400');
            }
        }

        // Handle Identity Form Submit
        async function handleIdentitySubmit(e) {
            e.preventDefault();
            
            const btn = document.getElementById('verify-btn');
            const originalContent = btn.innerHTML;
            
            // Get raw Aadhaar number (remove spaces)
            const aadhaarInput = document.getElementById('aadhaar').value.replace(/\s/g, '');
            const voterId = document.getElementById('voterid').value.toUpperCase();
            
            // Validation
            if (aadhaarInput.length !== 12) {
                showError('Please enter complete 12-digit Aadhaar number');
                document.getElementById('aadhaar').classList.add('border-red-500');
                return;
            }
            
            if (voterId.length < 5) {
                showError('Please enter valid Voter ID (EPIC)');
                return;
            }
            
            // Loading state
            btn.disabled = true;
            btn.innerHTML = `<div class="loader"></div><span class="ml-2">Verifying with DigiLocker...</span>`;
            
            // Simulate API call to DigiLocker
            await simulateNetworkDelay(2000);
            
            // Store state
            state.aadhaar = aadhaarInput;
            state.voterId = voterId;
            state.mobile = '+91 ••••• ••' + Math.floor(Math.random() * 900 + 100);
            
            // Update UI
            document.getElementById('masked-mobile').textContent = state.mobile;
            
            // Move to OTP step
            transitionToStep(2);
            startResendTimer();
            
            // Simulate OTP sent
            showNotification('OTP sent to registered mobile number', 'success');
        }

        // OTP Handling
        function handleOtpInput(input, index) {
            // Only allow numbers
            input.value = input.value.replace(/\D/g, '');
            
            if (input.value.length === 1) {
                if (index < 5) {
                    document.querySelector(`#otp-container input[data-index="${index + 1}"]`).focus();
                } else {
                    setTimeout(verifyOTP, 300);
                }
            }
        }

        function handleOtpKeydown(e, index) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                document.querySelector(`#otp-container input[data-index="${index - 1}"]`).focus();
            }
        }

        async function verifyOTP() {
            const inputs = document.querySelectorAll('#otp-container input');
            const otp = Array.from(inputs).map(i => i.value).join('');
            
            if (otp.length !== 6) {
                showError('Please enter complete 6-digit OTP');
                return;
            }
            
            const btn = document.getElementById('otp-verify-btn');
            btn.disabled = true;
            btn.innerHTML = `<div class="loader border-white border-t-transparent"></div><span class="ml-2">Verifying...</span>`;
            
            await simulateNetworkDelay(1500);
            
            // Mock verification
            state.otpVerified = true;
            state.sessionToken = generateSessionToken();
            
            showNotification('Identity verified successfully', 'success');
            transitionToStep(3);
        }

        // Timer for resend OTP
        let timerInterval;
        function startResendTimer() {
            let seconds = 30;
            const btn = document.getElementById('resend-btn');
            const timerSpan = document.getElementById('timer');
            
            btn.disabled = true;
            
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                seconds--;
                timerSpan.textContent = seconds;
                
                if (seconds <= 0) {
                    clearInterval(timerInterval);
                    btn.disabled = false;
                    btn.textContent = 'Resend OTP';
                }
            }, 1000);
        }

        function resendOTP() {
            showNotification('New OTP sent', 'success');
            startResendTimer();
        }

        // Render Party List
        function renderParties() {
            const container = document.getElementById('party-list');
            container.innerHTML = parties.map(party => `
                <div class="party-card border-2 border-slate-200 rounded-xl p-4 cursor-pointer relative overflow-hidden group" 
                     onclick="selectParty('${party.id}')" id="party-${party.id}">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 ${party.color} rounded-full flex items-center justify-center text-3xl shadow-lg text-white font-bold">
                            ${party.symbol}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-lg text-slate-900">${party.name}</h3>
                            <p class="text-sm text-slate-500">Candidate: ${party.leader}</p>
                        </div>
                        <div class="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center selection-indicator">
                            <div class="w-4 h-4 rounded-full bg-blue-600 opacity-0 transform scale-0 transition-all"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function selectParty(partyId) {
            // Remove previous selection
            document.querySelectorAll('.party-card').forEach(card => {
                card.classList.remove('selected');
                card.querySelector('.selection-indicator div').classList.remove('opacity-100', 'scale-100');
                card.querySelector('.selection-indicator div').classList.add('opacity-0', 'scale-0');
            });
            
            // Add selection to clicked
            const selected = document.getElementById(`party-${partyId}`);
            selected.classList.add('selected');
            selected.querySelector('.selection-indicator div').classList.remove('opacity-0', 'scale-0');
            selected.querySelector('.selection-indicator div').classList.add('opacity-100', 'scale-100');
            
            state.selectedParty = parties.find(p => p.id === partyId);
            
            // Show confirmation dialog after short delay
            setTimeout(() => {
                if (confirm(`You have selected: ${state.selectedParty.name}\n\nProceed to final confirmation?`)) {
                    transitionToStep(4);
                    updateFinalSelection();
                }
            }, 300);
        }

        function updateFinalSelection() {
            const container = document.getElementById('final-selection');
            container.innerHTML = `
                <div class="w-12 h-12 ${state.selectedParty.color} rounded-full flex items-center justify-center text-xl text-white">
                    ${state.selectedParty.symbol}
                </div>
                <div>
                    <p class="font-bold text-slate-900">${state.selectedParty.name}</p>
                    <p class="text-xs text-slate-500">New Delhi Constituency</p>
                </div>
            `;
        }

        // Final OTP Handling
        function handleFinalOtpInput(input, index) {
            input.value = input.value.replace(/\D/g, '');
            if (input.value.length === 1 && index < 3) {
                document.querySelector(`#final-otp-container input[data-index="${index + 1}"]`).focus();
            }
        }

        function handleFinalOtpKeydown(e, index) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                document.querySelector(`#final-otp-container input[data-index="${index - 1}"]`).focus();
            }
        }

        async function submitFinalVote() {
            const inputs = document.querySelectorAll('#final-otp-container input');
            const otp = Array.from(inputs).map(i => i.value).join('');
            
            if (otp.length !== 4) {
                showError('Please enter complete 4-digit OTP');
                return;
            }
            
            const btn = document.getElementById('final-submit-btn');
            btn.disabled = true;
            btn.innerHTML = `<div class="loader border-white border-t-transparent"></div><span class="ml-2">Submitting...</span>`;
            
            await simulateNetworkDelay(2000);
            
            // Record vote
            state.hasVoted = true;
            
            // Generate receipt details
            document.getElementById('tx-id').textContent = '#EVM2024-' + Math.floor(Math.random() * 90000 + 10000);
            document.getElementById('timestamp').textContent = new Date().toLocaleString('en-IN');
            
            transitionToStep('success');
        }

        function backToVoting() {
            transitionToStep(3);
            document.querySelectorAll('#final-otp-container input').forEach(i => i.value = '');
        }

        // UI Helpers
        function transitionToStep(step) {
            // Hide all steps
            document.querySelectorAll('.step-content').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Show target step
            const target = step === 'success' ? document.getElementById('success-screen') : document.getElementById(`step-${step}`);
            target.classList.remove('hidden');
            gsap.fromTo(target, {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.4, ease: "power2.out"});
            
            state.currentStep = step;
            updateProgress();
            updateStepIndicators(step);
        }

        function updateStepIndicators(currentStep) {
            const steps = [1, 2, 3];
            steps.forEach(step => {
                const indicator = document.querySelector(`#step-${step}-indicator div`);
                if (step < currentStep) {
                    indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm step-completed transition-all';
                    indicator.innerHTML = '✓';
                } else if (step === currentStep) {
                    indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm step-active transition-all';
                    indicator.textContent = step;
                } else {
                    indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm step-pending transition-all';
                    indicator.textContent = step;
                }
            });
        }

        function updateProgress() {
            const progress = state.currentStep === 'success' ? 100 : ((state.currentStep - 1) / 2) * 100;
            document.getElementById('progress-bar').style.width = progress + '%';
        }

        function showSecurityInfo() {
            document.getElementById('security-modal').classList.remove('hidden');
        }

        function closeSecurityInfo() {
            document.getElementById('security-modal').classList.add('hidden');
        }

        function showError(message) {
            showNotification(message, 'error');
        }

        function showNotification(message, type) {
            const div = document.createElement('div');
            div.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-xl z-50 transform transition-all duration-300 translate-x-full ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium flex items-center gap-2`;
            div.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'}"></path></svg>
                ${message}
            `;
            document.body.appendChild(div);
            
            setTimeout(() => div.classList.remove('translate-x-full'), 100);
            setTimeout(() => {
                div.classList.add('translate-x-full');
                setTimeout(() => div.remove(), 300);
            }, 3000);
        }

        function downloadReceipt() {
            const receipt = `
E-VOTE INDIA - OFFICIAL RECEIPT
---------------------------------
Transaction ID: ${document.getElementById('tx-id').textContent}
Timestamp: ${document.getElementById('timestamp').textContent}
Constituency: New Delhi - 07

VOTE DETAILS:
Status: VERIFIED
Method: Digital Remote Voting
Authentication: DigiLocker + Dual OTP

This is an official record of your vote.
Keep this receipt confidential.
---------------------------------
            `;
            
            const blob = new Blob([receipt], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vote-Receipt-${Date.now()}.txt`;
            a.click();
        }

        // Utilities
        function simulateNetworkDelay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function generateSessionToken() {
            return 'sess_' + Math.random().toString(36).substr(2, 9);
        }

        // Security: Prevent back button after vote
        window.onpopstate = function() {
            if (state.hasVoted) {
                alert('For security reasons, you cannot navigate back after voting. Please close the session.');
                history.pushState(null, null, location.href);
            }
        };