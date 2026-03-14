import { useEffect, useRef, useState } from 'react';
import { recordInteraction } from '../services/algorithm';

export default function QuoteCard({ verse, loadNext }) {
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const { reference, content, genre } = verse;

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (loadNext) loadNext();
            } else {
                setIsVisible(false);
            }
        }, { threshold: 0.6 });

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [loadNext]);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                recordInteraction(genre);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, genre]);

    return (
        <div
            ref={cardRef}
            className="quote-card"
            onClick={() => recordInteraction(genre)}
        >
            <div
                className="quote-content"
                dangerouslySetInnerHTML={{ __html: content }}
            />
            <div className="quote-reference">{reference}</div>
        </div>
    );
}
