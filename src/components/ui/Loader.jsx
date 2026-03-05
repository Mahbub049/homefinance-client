export default function Loader({ text = "Loading..." }) {
  return (
    <div className="bg-white border rounded-lg p-6 text-center">
      <div className="animate-pulse text-gray-500">{text}</div>
    </div>
  );
}