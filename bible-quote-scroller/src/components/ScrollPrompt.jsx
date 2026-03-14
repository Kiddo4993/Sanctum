export default function ScrollPrompt({ onClose }) {
    return (
        <div className="bottom-sheet-overlay" onClick={onClose}>
            <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                <h2>Want to save your preferences?</h2>
                <p>Sign up to carry your personalized feed across devices.</p>
                <div className="nudge-buttons">
                    <button className="btn-primary" onClick={onClose}>
                        Sign Up (Coming in Version 2)
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        Not Now
                    </button>
                </div>
            </div>
        </div>
    );
}
