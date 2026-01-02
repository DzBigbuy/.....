document.addEventListener('DOMContentLoaded', () => {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBR4q9dem2cVUY-r7bSwzsLQV4M2LNi4zQ",
        authDomain: "studio-7316459997-f5ae3.firebaseapp.com",
        projectId: "studio-7316459997-f5ae3",
        storageBucket: "studio-7316459997-f5ae3.appspot.com",
        messagingSenderId: "647609073070",
        appId: "1:647609073070:web:d17c6eee6a15eb42a45c3f"
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- DOM Elements ---
    const traderAdsContainer = document.getElementById('trader-ads-container');
    const marketerAdsContainer = document.getElementById('marketer-ads-container');
    const authContainer = document.getElementById('auth-container');
    const postAdCtaContainer = document.getElementById('post-ad-cta-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const postAdForm = document.getElementById('post-ad-form');
    const errorMessageDiv = document.getElementById('error-message');


    // --- Firebase Auth State Management ---
    auth.onAuthStateChanged(async user => {
        if (authContainer) { // Only run this on pages with authContainer
             if (user) {
                // User is signed in
                const userProfileRef = db.collection('users').doc(user.uid).collection('profile').doc(user.uid);
                const doc = await userProfileRef.get();
                if (doc.exists) {
                    const userProfile = doc.data();
                    authContainer.innerHTML = `
                        <div class="user-info">
                            <a href="/account.html" class="user-name-link">مرحباً، ${userProfile.firstName}</a>
                            <button id="logout-btn" class="logout-btn">تسجيل الخروج</button>
                        </div>
                    `;
                    document.getElementById('logout-btn').addEventListener('click', () => {
                        auth.signOut();
                    });

                    // Show "Post Ad" button on the main page
                    if(postAdCtaContainer) {
                        postAdCtaContainer.innerHTML = `<a href="/post-ad.html" class="post-ad-btn">أضف إعلانًا جديدًا</a>`;
                    }
                }
            } else {
                // User is signed out
                authContainer.innerHTML = '<a href="/login.html" class="login-btn">تسجيل الدخول</a>';
                 if(postAdCtaContainer) {
                    postAdCtaContainer.innerHTML = '';
                }
            }
        }
    });

    // --- Ad Fetching and Rendering ---
    async function fetchAndRenderAds(userType, container) {
        if (!container) return; // Don't run if the container doesn't exist on the page

        try {
            // Firestore query now checks for the 'userType' field in the 'ads' collection
            const adsCollection = db.collection('ads').where('userType', '==', userType);
            const snapshot = await adsCollection.get();

            if (snapshot.empty) {
                container.innerHTML = '<p>لا توجد إعلانات متاحة حاليًا.</p>';
                return;
            }

            container.innerHTML = ''; // Clear skeleton loaders
            snapshot.forEach(doc => {
                const ad = doc.data();
                ad.id = doc.id;
                const adCard = createAdCard(ad);
                container.appendChild(adCard);
            });

        } catch (error) {
            console.error(`Error fetching ${userType} ads: `, error);
            container.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات.</p>';
        }
    }

    function createAdCard(ad) {
        const cardLink = document.createElement('a');
        cardLink.href = `/ad-detail.html?id=${ad.id}`;
        cardLink.className = 'ad-card';

        const image = document.createElement('img');
        image.src = ad.imageURLs && ad.imageURLs.length > 0 ? ad.imageURLs[0] : 'https://placehold.co/600x400/27272a/FFF?text=Ad';
        image.alt = ad.title;
        image.className = 'ad-card-image';
        cardLink.appendChild(image);

        const header = document.createElement('div');
        header.className = 'ad-card-header';
        const headerTop = document.createElement('div');
        headerTop.className = 'ad-card-header-top';
        const title = document.createElement('h3');
        title.className = 'ad-card-title';
        title.textContent = ad.title;
        headerTop.appendChild(title);
        const badge = document.createElement('span');
        badge.className = `ad-card-badge ${ad.userType || 'trader'}`;
        badge.textContent = (ad.userType === 'trader') ? 'تاجر' : 'مسوق';
        headerTop.appendChild(badge);
        header.appendChild(headerTop);
        const category = document.createElement('p');
        category.className = 'ad-card-category';
        category.textContent = ad.category;
        header.appendChild(category);
        cardLink.appendChild(header);

        const content = document.createElement('div');
        content.className = 'ad-card-content';
        const description = document.createElement('p');
        description.className = 'ad-card-description';
        description.textContent = ad.description;
        content.appendChild(description);
        cardLink.appendChild(content);

        const footer = document.createElement('div');
        footer.className = 'ad-card-footer';
        const price = document.createElement('span');
        price.className = 'ad-card-price';
        price.textContent = `${ad.price} ر.س`;
        footer.appendChild(price);
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'ad-card-details-btn';
        detailsBtn.textContent = 'عرض التفاصيل ←';
        footer.appendChild(detailsBtn);
        cardLink.appendChild(footer);

        return cardLink;
    }

    // --- Form Handlers ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    window.location.href = '/'; // Redirect to homepage on success
                })
                .catch(error => {
                    console.error("Login Error:", error);
                    errorMessageDiv.textContent = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
                });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = registerForm.firstName.value;
            const lastName = registerForm.lastName.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const userType = registerForm.userType.value;

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Create user profile in Firestore
                    const user = userCredential.user;
                    const userProfileRef = db.collection('users').doc(user.uid).collection('profile').doc(user.uid);
                    return userProfileRef.set({
                        id: user.uid,
                        userType: userType,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        phoneNumber: '',
                        registrationDate: new Date().toISOString(),
                    });
                })
                .then(() => {
                    window.location.href = '/'; // Redirect to homepage on success
                })
                .catch(error => {
                    console.error("Registration Error:", error);
                    errorMessageDiv.textContent = 'فشل إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل.';
                });
        });
    }

    if (postAdForm) {
        postAdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                errorMessageDiv.textContent = 'يجب عليك تسجيل الدخول أولاً.';
                return;
            }

            // Fetch user profile to get their userType
            const userProfileRef = db.collection('users').doc(user.uid).collection('profile').doc(user.uid);
            const doc = await userProfileRef.get();
            if (!doc.exists) {
                errorMessageDiv.textContent = 'لم يتم العثور على ملفك الشخصي.';
                return;
            }
            const userProfile = doc.data();

            const adData = {
                title: postAdForm.title.value,
                description: postAdForm.description.value,
                category: postAdForm.category.value,
                price: parseFloat(postAdForm.price.value),
                imageURLs: [postAdForm.imageUrl.value || 'https://placehold.co/600x400/27272a/FFF?text=Ad'],
                userProfileId: user.uid,
                userType: userProfile.userType, // Set userType from the user's profile
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            db.collection('ads').add(adData)
                .then(() => {
                    // Redirect to the correct ads page based on userType
                    if (userProfile.userType === 'trader') {
                        window.location.href = '/#trader-ads';
                    } else {
                        window.location.href = '/#marketer-ads';
                    }
                })
                .catch(error => {
                    console.error("Error adding ad: ", error);
                    errorMessageDiv.textContent = 'فشل إضافة الإعلان. يرجى المحاولة مرة أخرى.';
                });
        });
    }

    // --- Account Page Logic ---
    async function populateAccountPage() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const profileContent = document.getElementById('profile-content');
        if (!profileContent) return;

        // Fetch user profile
        const userProfileRef = db.collection('users').doc(user.uid).collection('profile').doc(user.uid);
        const profileDoc = await userProfileRef.get();

        if (profileDoc.exists) {
            const profile = profileDoc.data();
            document.getElementById('profile-name').textContent = `${profile.firstName} ${profile.lastName}`;
            document.getElementById('profile-email').textContent = profile.email;
            document.getElementById('profile-usertype').textContent = profile.userType === 'trader' ? 'تاجر' : 'مسوق';
            document.getElementById('profile-since').textContent = new Date(profile.registrationDate).toLocaleDateString('ar-EG');
        } else {
             profileContent.innerHTML = '<p>لم يتم العثور على بيانات الملف الشخصي.</p>';
        }

        // Fetch user ads
        const adsContent = document.getElementById('user-ads-content');
        const adsQuery = db.collection('ads').where('userProfileId', '==', user.uid);
        const adsSnapshot = await adsQuery.get();

        if (adsSnapshot.empty) {
            adsContent.innerHTML = '<p>لم تقم بنشر أي إعلانات بعد.</p>';
        } else {
            adsSnapshot.forEach(adDoc => {
                const ad = adDoc.data();
                ad.id = adDoc.id;
                const adCard = createAdCard(ad);
                adsContent.appendChild(adCard);
            });
        }
    }


    // --- Initial Page Load Logic ---
    if (document.body.id === 'account-page-body') {
        populateAccountPage();
    }
    
    // Fetch ads for the homepage
    if (traderAdsContainer && marketerAdsContainer) {
        fetchAndRenderAds('trader', traderAdsContainer);
        fetchAndRenderAds('marketer', marketerAdsContainer);
    }
});
