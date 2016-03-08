Calling methods with delay
===========================

Sometimes you may want to postpone a method invocation; for example, to send an email to newly registered users a day after their registration. To do this, just call the ``BackgroundJob.Schedule`` method and pass the needed time span:

.. code-block:: c#

   BackgroundJob.Schedule(
       () => Console.WriteLine("Hello, world"),
       TimeSpan.FromDays(1));

Delayed jobs are placed in a separate set than message jobs. The :doc:`Hangfire Server <../background-processing/processing-background-jobs>` periodically checks this set to see if their are any jobs to be placed onto a message queue. If their are, the Server removes the job from the set and sends it to the appropriate queue. The default interval for this periodic check is ``15 seconds``, but you can change it.  To do this pass the corresponding option to the ``BackgroundJobServer`` ctor.

.. code-block:: c#

  var options = new BackgroundJobServerOptions
  {
      SchedulePollingInterval = TimeSpan.FromMinutes(1)
  };

  var server = new BackgroundJobServer(options);

If you are processing your jobs inside an ASP.NET application, you should be warned that some settings (i.e. increasing the queue polling) may prevent your scheduled jobs from being performed in-time (before the ASP.Net thread spins down). To avoid this behavour, perform the following steps:

* `Disable Idle Timeout <http://bradkingsley.com/iis7-application-pool-idle-time-out-settings/>`_ – set its value to ``0``.
* Use the `application auto-start <http://weblogs.asp.net/scottgu/auto-start-asp-net-applications-vs-2010-and-net-4-0-series>`_ feature.
