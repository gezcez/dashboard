// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSendTestEmail } from "@/common/hooks/util-hooks"
import { Mail, Send, CheckCircle, XCircle, Loader2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import UserTooltip from "@/components/tooltips/user-tooltip"

export default function EmailTestingPage() {
  const { mutate: sendTestEmail, isPending, isSuccess, isError, data, error } = useSendTestEmail()

  const handleSendTestEmail = () => {
    sendTestEmail()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Email Testing</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Email Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify your email configuration is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will send a test email to <strong>contact@phasenull.dev</strong> using your current email settings.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleSendTestEmail} 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isError && <XCircle className="h-5 w-5 text-red-500" />}
              {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              Email Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPending && !isSuccess && !isError && (
              <div className="text-muted-foreground text-center py-8">
                Click "Send Test Email" to test your email configuration
              </div>
            )}

            {isPending && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending test email...</span>
              </div>
            )}

            {isSuccess && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Email sent successfully!</span>
                </div>
                
                {data && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="text-sm space-y-1">
                      {data.email_uuid && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email UUID:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {data.email_uuid}
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Delivered
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isError && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Failed to send email</span>
                </div>
                
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {data?.result?.message || error?.message || 'An unknown error occurred while sending the test email.'}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Details Card */}
      {(isSuccess || isError) && (
        <Card>
          <CardHeader>
            <CardTitle>Email Test Details</CardTitle>
            <CardDescription>
              Technical details about the email test attempt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Target Email:</span>
                  <div className="font-mono">contact@phasenull.dev</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject:</span>
                  <div>Test Email from Gezcez</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div>Other</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Target User ID:</span>
                  <UserTooltip user_id={1}/>
                </div>
              </div>
              
              {data && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Response Data:</h4>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}