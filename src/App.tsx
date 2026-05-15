import { useState } from 'react';
import { Container, Theme } from './settings/types';
import { InsumaKitchenDashboard } from './components/generated/InsumaKitchenDashboard';
import { OnboardingFlow } from './components/generated/OnboardingFlow';

let theme: Theme = 'light';
// only use 'centered' container for standalone components, never for full page apps or websites.
let container: Container = 'none';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('insuma_onboarding_ok') === '1'
  );

  const content = onboardingDone
    ? <InsumaKitchenDashboard />
    : <OnboardingFlow onComplete={() => setOnboardingDone(true)} />;

  if (container === 'centered') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        {content}
      </div>
    );
  } else {
    return content;
  }
}

export default App;
