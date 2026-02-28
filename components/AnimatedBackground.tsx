export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-500"></div>

            <ul className="circles pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <li key={i}></li>
                ))}
            </ul>
        </div>
    );
}
