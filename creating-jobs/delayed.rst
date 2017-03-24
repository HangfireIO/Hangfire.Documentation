Delayed Jobs
=============

.. admonition:: Under construction
   :class: warning

   Scheduling delayed jobs: overview, utc notes, versioning issues due to delay, canceling them, multiple queues catch, enqueueing them earlier, deleting them, processing is slow, always-running.

Sometimes you may want to postpone a method invocation; for example, to send an email to newly registered users a day after their registration. To do this, just call the ``BackgroundJob.Schedule`` method and pass the needed time span:

.. code-block:: c#

   BackgroundJob.Schedule(
       () => Console.WriteLine("Hello, world"),
       TimeSpan.FromDays(1));

:doc:`Hangfire Server <../background-processing/processing-background-jobs>` periodically check the schedule to enqueue scheduled jobs to their queues, allowing workers to perform them. By default, check interval is equal to ``15 seconds``, but you can change it, just pass the corresponding option to the ``BackgroundJobServer`` ctor.

.. code-block:: c#

  var options = new BackgroundJobServerOptions
  {
      SchedulePollingInterval = TimeSpan.FromMinutes(1)
  };

  var server = new BackgroundJobServer(options);

If you are processing your jobs inside an ASP.NET application, you should be warned about some setting that may prevent your scheduled jobs to be performed in-time. To avoid that behavior, perform the following steps:

* `Disable Idle Timeout <http://bradkingsley.com/iis7-application-pool-idle-time-out-settings/>`_ – set its value to ``0``.
* Use the `application auto-start <http://weblogs.asp.net/scottgu/auto-start-asp-net-applications-vs-2010-and-net-4-0-series>`_ feature.
