import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import FeatureGrid from '../components/FeatureGrid';
import Leaderboard from '../components/Leaderboard';
import Vision from '../components/Vision';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function LandingPage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <HowItWorks />
                <FeatureGrid />
                <Leaderboard />
                <Vision />
                <CTA />
            </main>
            <Footer />
        </>
    );
}
