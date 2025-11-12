
import React, { useState } from 'react';
import { StarIcon } from './Icons';

interface RatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <StarIcon 
            className={`w-8 h-8 cursor-pointer ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default Rating;