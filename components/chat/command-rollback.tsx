import { useState } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { CommandResult } from '@/lib/commands/types'

interface CommandRollbackProps {
  command: CommandResult
  onRollbackComplete?: () => void
}

export function CommandRollback({ command, onRollbackComplete }: CommandRollbackProps) {
  const [isRollingBack, setIsRollingBack] = useState(false)
  const supabase = useSupabase()
  const { toast } = useToast()

  const handleRollback = async () => {
    try {
      setIsRollingBack(true)

      // Call the rollback function from the database
      const { error } = await supabase
        .rpc('rollback_command_transaction', {
          transaction_id: command.transactionId
        })

      if (error) throw error

      onRollbackComplete?.()

      toast({
        title: 'Success',
        description: 'Command successfully rolled back'
      })
    } catch (error) {
      console.error('Error rolling back command:', error)
      toast({
        title: 'Error',
        description: 'Failed to rollback command',
        variant: 'destructive'
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  // Only show rollback UI if command can be rolled back
  if (!command.canRollback) return null

  return (
    <Alert variant="default" className="mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>This command can be rolled back</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRollback}
          disabled={isRollingBack}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {isRollingBack ? 'Rolling back...' : 'Rollback'}
        </Button>
      </AlertDescription>
    </Alert>
  )
} 