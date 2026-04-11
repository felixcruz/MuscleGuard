"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    text: "I lost 35 lbs on Wegovy but felt weaker every week. After two months with MuscleGuard, my protein is on track and I actually feel strong again. This app understands what we go through.",
  },
  {
    name: "James R.",
    text: "My endocrinologist never mentioned protein. I found out the hard way when my body composition scan showed I had lost 12 lbs of lean mass. MuscleGuard would have caught that from day one.",
  },
  {
    name: "Daniela P.",
    text: "The meal planner is a game changer. When I can barely eat 800 calories, having small, high-protein meals ready to go makes all the difference. I stopped guessing and started hitting my goals.",
  },
  {
    name: "Marcus T.",
    text: "I run 4 times a week and started Mounjaro for body composition. MuscleGuard gave me a training plan that combines my running with the strength work I was missing. Nobody else does this.",
  },
  {
    name: "Rachel K.",
    text: "The dose-adjusted protein target was eye-opening. I had no idea that going from 1mg to 2.4mg semaglutide meant I needed that much more protein. Now I know my number every single day.",
  },
  {
    name: "Anthony L.",
    text: "I tried MyFitnessPal but it felt overwhelming and irrelevant. MuscleGuard cuts straight to what matters: protein, muscle, and my medication. Simple, focused, and it actually works.",
  },
  {
    name: "Michelle W.",
    text: "The medication reminders saved me. I kept forgetting my injection day and my whole schedule was off. Now I get a reminder, I log it, and my plan adjusts automatically. Brilliant.",
  },
  {
    name: "David H.",
    text: "The weekly report with the letter grade keeps me accountable in a way nothing else has. Getting a B last week motivated me to push for an A this week. It makes progress feel tangible.",
  },
  {
    name: "Lauren C.",
    text: "I switched the communication style to 'direct' and now the app talks to me exactly how I need it. No fluff, just numbers and actions. It feels like it was built for me.",
  },
  {
    name: "Chris B.",
    text: "As a swimmer on tirzepatide, I thought no app would understand my situation. MuscleGuard gave me swim sessions plus the complementary strength work I needed. I have not lost a pound of muscle.",
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const t = testimonials[current];

  return (
    <div
      className="relative max-w-2xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-white rounded-2xl border p-8 sm:p-10 min-h-[220px] flex flex-col justify-center">
        <Quote className="h-8 w-8 text-brand-200 mb-4" />
        <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
          &ldquo;{t.text}&rdquo;
        </p>
        <p className="mt-5 font-semibold text-gray-900">{t.name}</p>
        <p className="text-xs text-gray-400">MuscleGuard user</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-6 bg-brand-600" : "w-2 bg-gray-200"
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
