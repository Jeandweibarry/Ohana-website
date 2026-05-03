


// ------------------------------------- CSS -------------------------------------

const modalStyles = `
/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 0;
    border: 1px solid #888;
    width: 90%;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-50px); }
    to { opacity: 1; transform: translateY(0); }
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    margin: 10px;
    cursor: pointer;
    position: relative;
    z-index: 99999;
}

.close:hover {
    color: #000;
}

.auth-form {
    display: none;
    padding: 20px 30px 30px;
    text-align: center;
}

.auth-form.active {
    display: block;
}

.auth-form h2 {
    margin-bottom: 10px;
    color: #333;
    font-family: 'Cormorant Garamond', serif;
}

.auth-form p {
    margin-bottom: 20px;
    color: #666;
    font-size: 14px;
}

.form-group {
    margin-bottom: 15px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-group input:focus {
    outline: none;
    border-color: #1C1C1C;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.auth-btn {
    width: 100%;
    padding: 12px;
    background-color: #1C1C1C;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
}

.auth-btn:hover {
    background-color: #0D3678;
}

.auth-switch {
    margin-top: 20px;
    font-size: 14px;
    color: #666;
}

.auth-switch a {
    color: #0D3678;
    text-decoration: none;
}

.auth-switch a:hover {
    text-decoration: underline;
}

/* 1. Animate the dark backdrop fading out */
.modal.fade-out {
    animation: backdropFadeOut 0.2s ease-in forwards;
}

/* 2. Animate the modal box sliding up and fading out */
.modal.fade-out .modal-content {
    animation: modalFadeOut 0.2s ease-in forwards;
}

@keyframes backdropFadeOut {
    from { background-color: rgba(0, 0, 0, 0.5); }
    to { background-color: rgba(0, 0, 0, 0); }
}

@keyframes modalFadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-50px); }
}

/* Update your existing .auth-form.active class to include the animation */
.auth-form.active {
    display: block;
    animation: formFadeIn 0.25s ease-out forwards;
}

/* Add these new classes to the bottom of your CSS string */
.auth-form.fade-out-form {
    display: block !important; /* Forces it to stay visible while fading out */
    animation: formFadeOut 0.2s ease-in forwards;
}

/* The incoming form fades in and slides up slightly */
@keyframes formFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* The outgoing form fades out and slides up slightly */
@keyframes formFadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
}

`;

function injectIndexStyles() {
    if (document.getElementById('index-inline-style')) {
        return;
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'index-inline-style';
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
}

injectIndexStyles();
