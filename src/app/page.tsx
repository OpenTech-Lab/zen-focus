import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-violet-50 dark:from-gray-900 dark:to-gray-800'>
      <div className='text-center space-y-8 w-full max-w-4xl mx-auto'>
        <Card className='backdrop-blur-sm bg-card/80'>
          <CardHeader>
            <CardTitle className='text-6xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent'>
              ZenFocus
            </CardTitle>
            <CardDescription className='text-2xl font-light'>
              Minimalistic Focus & Wellness
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-muted-foreground'>
              Your focus timer application is being set up with shadcn/ui components...
            </p>

            {/* Session Mode Tabs Demo */}
            <Tabs defaultValue='study' className='w-full'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='study' className='data-[state=active]:bg-emerald-500'>
                  🎓 Study
                </TabsTrigger>
                <TabsTrigger value='deepwork' className='data-[state=active]:bg-blue-500'>
                  💻 Deep Work
                </TabsTrigger>
                <TabsTrigger value='yoga' className='data-[state=active]:bg-violet-500'>
                  🧘 Yoga
                </TabsTrigger>
                <TabsTrigger value='zen' className='data-[state=active]:bg-gray-500'>
                  🌌 Zen
                </TabsTrigger>
              </TabsList>

              <TabsContent value='study' className='space-y-4'>
                <div className='text-center'>
                  <div className='timer-display text-emerald-600'>25:00</div>
                  <Progress value={75} className='w-full mt-4' />
                  <Badge variant='secondary' className='mt-2'>
                    Pomodoro Technique
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value='deepwork' className='space-y-4'>
                <div className='text-center'>
                  <div className='timer-display text-blue-600'>50:00</div>
                  <Progress value={45} className='w-full mt-4' />
                  <Badge variant='secondary' className='mt-2'>
                    Deep Work Session
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value='yoga' className='space-y-4'>
                <div className='text-center'>
                  <div className='timer-display text-violet-600'>10:00</div>
                  <Progress value={30} className='w-full mt-4' />
                  <Badge variant='secondary' className='mt-2'>
                    Mindful Movement
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value='zen' className='space-y-4'>
                <div className='text-center'>
                  <div className='timer-display text-gray-600'>∞</div>
                  <Progress value={0} className='w-full mt-4' />
                  <Badge variant='secondary' className='mt-2'>
                    Open-ended Focus
                  </Badge>
                </div>
              </TabsContent>
            </Tabs>

            {/* Control Buttons Demo */}
            <div className='flex justify-center space-x-4'>
              <Button size='lg' className='bg-emerald-600 hover:bg-emerald-700'>
                Start Session
              </Button>
              <Button size='lg' variant='outline'>
                Pause
              </Button>
              <Button size='lg' variant='ghost'>
                Reset
              </Button>
            </div>

            <p className='text-sm text-muted-foreground'>
              shadcn/ui components are successfully integrated with Tailwind CSS
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
