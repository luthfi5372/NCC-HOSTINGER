export default function TestPage() {
  return (
    <div className="p-20 text-center">
      <h1 className="text-4xl font-bold">Deployment Test: SUCCESS</h1>
      <p className="mt-4 text-slate-500">Last Updated: {new Date().toLocaleString()}</p>
    </div>
  );
}
