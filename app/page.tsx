import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-green-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold text-gray-800 mb-4">
            🎅 Secret Santa 🎁
          </h1>
          <p className="text-2xl text-gray-600">
            Gift Opening Game
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Player Card */}
          <Link href="/player">
            <div className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-transform cursor-pointer border-4 border-transparent hover:border-blue-500">
              <div className="text-center">
                <div className="text-7xl mb-6">📱</div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Player View
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Select your identity and submit guesses for who each person&apos;s Secret Santa is
                </p>
                <div className="bg-blue-100 rounded-xl p-4">
                  <ul className="text-left text-gray-700 space-y-2">
                    <li>• Choose your name</li>
                    <li>• See current recipient</li>
                    <li>• Submit your guess</li>
                    <li>• Skip when it&apos;s your turn</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>

          {/* Host Card */}
          <Link href="/host">
            <div className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-transform cursor-pointer border-4 border-transparent hover:border-red-500">
              <div className="text-center">
                <div className="text-7xl mb-6">🖥️</div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Host / Projector
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Control the game flow, show the current recipient, and manage the timer
                </p>
                <div className="bg-red-100 rounded-xl p-4">
                  <ul className="text-left text-gray-700 space-y-2">
                    <li>• Start the game</li>
                    <li>• Display current recipient</li>
                    <li>• Show countdown timer</li>
                    <li>• Advance to next person</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-yellow-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            How to Play
          </h3>
          <ol className="text-lg text-gray-700 space-y-3">
            <li>
              <strong>1. Host Setup:</strong> Open the Host view on a projector or shared screen
            </li>
            <li>
              <strong>2. Players Join:</strong> Each player opens the Player view on their phone/device and selects their name
            </li>
            <li>
              <strong>3. Start Game:</strong> Host clicks &quot;Start&quot; to randomize the opening order
            </li>
            <li>
              <strong>4. Open Gifts:</strong> When a name appears, that person opens their gift
            </li>
            <li>
              <strong>5. Submit Guesses:</strong> All other players guess who that person&apos;s Secret Santa is
            </li>
            <li>
              <strong>6. Repeat:</strong> Host clicks &quot;Next&quot; to continue until everyone has opened their gift
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
