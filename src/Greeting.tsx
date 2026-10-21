import Skeleton from './Skeleton'
import { firstName, greetingWord } from './userName'

type GreetingProps = {
  name: string | null
}

function Greeting({ name }: GreetingProps) {
  const first = firstName(name)

  return (
    <div className="greeting">
      {name === null ? (
        <Skeleton width={190} height={18} />
      ) : (
        <span>{greetingWord()}{first ? ', ' + first : ''} 👋</span>
      )}
    </div>
  )
}

export default Greeting