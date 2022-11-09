Using Cancellation Tokens
===========================

Hangfire provides support for cancellation tokens for our background jobs to let them know when a shutdown request was initiated, or job performance was aborted. In the former case the job will be automatically put back to the beginning of its queue, allowing Hangfire to process it after restart.

We should use cancellation tokens as much as possible – they greatly lower the application shutdown time and the risk of the appearance of the ``ThreadAbortException``.

CancellationToken
-----------------

Starting from Hangfire 1.7.0 it's possible to use a regular ``CancellationToken`` class for this purpose. Unlike the previous ``IJobCancellationToken``-based implementation, the new one is fully asynchronous and doesn't lead to immediate storage requests so it's now safe to use it even in tight loops.

.. code-block:: c#

   public async Task LongRunningMethod(CancellationToken token)
   {
       for (var i = 0; i < Int32.MaxValue; i++)
       {
           await Task.Delay(TimeSpan.FromSeconds(1), token);
       }
   }

When creating such a background job, any ``CancellationToken`` instance can be used, it will be replaced internally just before performing a background job.

.. code-block:: c#

   BackgroundJob.Enqueue<IService>(x => x.LongRunningMethod(CancellationToken.None));

Dedicated background process is watching for all the current background jobs that have a cancellation token parameter in a method and polls the storage to watch their current states. When state change is detected or when shutdown is requested, the corresponding cancellation token is canceled. 

The polling delay is configurable via the ``BackgroundJobServerOptions.CancellationCheckInterval`` server option.

.. code-block:: c#

   services.AddHangfireServer(new BackgroundJobServerOptions
   {
       CancellationCheckInterval = TimeSpan.FromSeconds(5) // Default value
   });

IJobCancellationToken
---------------------

This is the obsolete implementation of cancellation tokens. Although it's implemented asynchronously in the same way as ``CancellationToken``-based one, we can't use it in many use cases. Backward compatibility is the only reason for using this interface nowadays, so we should prefer to use ``CancellationToken`` parameters in the new logic.

The interface contains the ``ThrowIfCancellationRequested`` method that throws the ``OperationCanceledException`` when cancellation was requested:

.. code-block:: c#

   public void LongRunningMethod(IJobCancellationToken cancellationToken)
   {
       for (var i = 0; i < Int32.MaxValue; i++)
       {
           cancellationToken.ThrowIfCancellationRequested();

           Thread.Sleep(TimeSpan.FromSeconds(1));
       }
   }

When we want to enqueue such method call as a background job, we can pass the ``null`` value as an argument for the token parameter, or use the ``JobCancellationToken.Null`` property to tell code readers that we are doing things right:

.. code-block:: c#

   BackgroundJob.Enqueue(() => LongRunningMethod(JobCancellationToken.Null));
   
.. admonition:: The implementation is resolved automatically
   :class: note

   Hangfire takes care of passing a proper non-null instance of ``IJobCancellationToken`` during the job execution at runtime.

