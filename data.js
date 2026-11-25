// The Deck: card data from the rulebook.
// Each suit card: [name, percent of baseline, label type]
// Label types: reps, side, steps, sec, secSide, hand, arm, leg, wt, armWt, secWt
const SUITS = {
  U: { name: 'Upper Body', symbol: '▲', color: '#B5432F', base: 'push', benchmark: 'Standard push-ups',
    cards: [
      ['Incline Push-Up', 100, 'reps'], ['Shoulder Taps', 90, 'side'], ['Plank Reach-Outs', 85, 'side'],
      ['Lateral Plank Walk', 75, 'steps'], ['Push-Up Negatives', 65, 'reps'], ['Standard Push-Up', 60, 'reps'],
      ['Wide Push-Up', 50, 'reps'], ['Staggered Push-Up', 45, 'reps'], ['Decline Push-Up', 40, 'reps'],
      ['T Push-Up', 30, 'side'] ] },
  C: { name: 'Core', symbol: '●', color: '#C99A1E', base: 'sit', benchmark: 'Sit-ups',
    cards: [
      ['Crunches', 100, 'reps'], ['Glute Bridge March', 50, 'side'], ['Russian Twist', 50, 'side'],
      ['Forearm Plank', 150, 'sec'], ['Bicycle Crunch', 50, 'side'], ['Toe-Touch Crunches', 60, 'reps'],
      ['Slow Mountain Climbers', 40, 'side'], ['Flutter Kicks', 40, 'side'], ['Side Plank', 75, 'secSide'],
      ['Lying Leg Raises', 35, 'reps'] ] },
  L: { name: 'Lower Body', symbol: '◆', color: '#2E8B57', base: 'bridge', benchmark: 'Glute bridges',
    cards: [
      ['Side-Lying Leg Raise', 75, 'side'], ['Fire Hydrants', 60, 'side'], ['Donkey Kicks', 55, 'side'],
      ['Glute Bridge', 100, 'reps'], ['Lateral Lunge', 35, 'side'], ['Hip Thrust', 75, 'reps'],
      ['Curtsy Lunge', 30, 'side'], ['Single-Leg Glute Bridge', 25, 'side'], ['Single-Leg Hip Thrust', 20, 'side'],
      ['Skater Squat', 15, 'side'] ] },
  A: { name: 'Arms', symbol: '✚', color: '#2F6DB5', base: 'curl', benchmark: 'Dumbbell curls',
    cards: [
      ['Grip Trainer Squeezes', 125, 'hand'], ["Farmer's Hold", 400, 'secWt'], ['Hammer Curl', 90, 'wt'],
      ['Dumbbell Curl', 85, 'wt'], ['Overhead Triceps Extension', 80, 'wt'], ['Concentration Curl', 70, 'armWt'],
      ['Zottman Curl', 60, 'wt'], ['Floor Skull Crusher', 50, 'wt'], ['Triceps Kickback', 40, 'armWt'],
      ['Diamond Push-Up', 35, 'reps'] ] },
  G: { name: 'Legs', symbol: '■', color: '#6B4A8A', base: 'squat', benchmark: 'Bodyweight squats',
    cards: [
      ['Calf Raise', 125, 'reps'], ['Bodyweight Squat', 100, 'reps'], ['Sumo Squat', 90, 'reps'],
      ['Wall Sit', 150, 'sec'], ['Step-Up', 40, 'leg'], ['Reverse Lunge', 35, 'leg'],
      ['Single-Leg Calf Raise', 50, 'leg'], ['Dumbbell Romanian Deadlift', 45, 'wt'], ['Hamstring Walkouts', 25, 'reps'],
      ['Bulgarian Split Squat', 20, 'leg'] ] },
};

const WILDCARDS = {
  W1: { name: 'Full-Body Finisher', points: 15 },
  W2: { name: 'Double Down', points: 0 },
};

// Baseline test fields, in the order they're asked.
const BASELINE_FIELDS = [
  { key: 'push', label: 'Standard push-ups', suit: 'U', hint: 'Hips level, lower to about a fist off the floor.' },
  { key: 'sit', label: 'Sit-ups', suit: 'C', hint: 'Traditional sit-ups. 1 sit-up = 1 second on timed holds.' },
  { key: 'bridge', label: 'Glute bridges', suit: 'L', hint: 'One max set with good form.' },
  { key: 'curl', label: 'Dumbbell curls', suit: 'A', hint: 'At the weight you prefer. Enter the weight below too.' },
  { key: 'lb', label: 'Curl weight (lb)', suit: 'A', hint: 'Every dumbbell card uses this weight until next week.' },
  { key: 'squat', label: 'Bodyweight squats', suit: 'G', hint: '1 squat = 1 second on the wall sit.' },
];
