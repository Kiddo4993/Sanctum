import { useState, useEffect } from 'react';

export default function EyeRestBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Show after 60 minutes
        const timer = setTimeout(() => {
            setShow(true);
        }, 60 * 60 * 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="full-screen-overlay" onClick={() => setShow(false)}>
            <div className="rest-message" onClick={(e) => e.stopPropagation()}>
                <h2>Time to Rest Your Eyes</h2>
                <p>You've been reading for an hour. Take a moment to look away, breathe, and reflect.</p>
                <button className="btn-primary" onClick={() => setShow(false)}>
                    Resume Reading
                </button>
            </div>
        </div>
    );
}
