/* 
    MONREI SAIGON - Interactivity Script
*/

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const scrollRevealElements = document.querySelectorAll('.reveal');

    // Fetch dynamic contact info from env (via API)
    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            const { email, phone } = data;
            if (email && phone) {
                const formattedPhone = phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
                
                const headerPhoneBtn = document.getElementById('header-phone-btn');
                const headerPhoneText = document.getElementById('header-phone-text');
                if (headerPhoneBtn && headerPhoneText) {
                    headerPhoneBtn.href = 'tel:' + phone;
                    headerPhoneText.textContent = formattedPhone;
                }
                
                const footerEmail = document.getElementById('footer-email');
                if (footerEmail) {
                    footerEmail.href = 'mailto:' + email;
                    footerEmail.textContent = email;
                }
                
                const footerPhone = document.getElementById('footer-phone');
                if (footerPhone) {
                    footerPhone.href = 'tel:' + phone;
                    footerPhone.textContent = formattedPhone;
                }
                
                const fixedCallBtn = document.getElementById('fixed-call-btn');
                const fixedZaloBtn = document.getElementById('fixed-zalo-btn');
                if (fixedCallBtn) fixedCallBtn.href = 'tel:' + phone;
                if (fixedZaloBtn) fixedZaloBtn.href = 'https://zalo.me/' + phone;
            }
        })
        .catch(err => console.error('Error fetching contact info:', err));

    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        revealOnScroll();
    });

    // Reveal on scroll logic
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        scrollRevealElements.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    };

    // Initial check
    revealOnScroll();

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(targetId);
            
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form Submission with Resend Integration
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn');
            const originalText = btn.textContent;
            
            // Collect Form Data
            const formData = {
                name: form.querySelector('input[type="text"]:not([name="website"])').value,
                phone: form.querySelector('input[type="tel"]').value,
                email: form.querySelector('input[type="email"]').value,
                message: form.querySelector('textarea').value,
                website: form.querySelector('input[name="website"]').value
            };

            btn.textContent = 'ĐANG GỬI...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    alert(result.message || 'Cảm ơn bạn đã quan tâm! Chúng tôi sẽ liên hệ lại sớm nhất.');
                    form.reset();
                } else {
                    throw new Error(result.message || 'Gửi mail thất bại');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng liên hệ trực tiếp qua số Hotline.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
