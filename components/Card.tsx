
export default function Card({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="card card-compact bg-gray-50 dark:bg-gray-800 shadow-sm mt-4 p-4" style={{ width: '450px', }}>
      <span className='text-gray-500 text-lg'>{title}</span>
      <div className="card-body w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
