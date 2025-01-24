export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-4xl font-bold">About AutoCRM</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="lead">
          AutoCRM is a modern customer relationship management system designed to streamline
          support operations and enhance customer satisfaction.
        </p>

        <h2 className="mt-8">Our Mission</h2>
        <p>
          We aim to provide businesses with powerful tools to manage customer relationships
          efficiently while maintaining a personal touch in every interaction.
        </p>

        <h2 className="mt-8">Key Features</h2>
        <ul>
          <li>Intelligent ticket management</li>
          <li>Real-time customer support</li>
          <li>Team collaboration tools</li>
          <li>Performance analytics</li>
          <li>Customizable workflows</li>
        </ul>
      </div>
    </div>
  )
} 