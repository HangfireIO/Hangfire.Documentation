Queued Jobs
============

.. admonition:: Under construction
   :class: warning

   Enqueueing fire-and-forget jobs: overview, latency notes, background job client, requeueing them, deleting them with already processed catch, order isn’t guaranteed, timeout.

Fire-and-forget method invocation has never been simpler. As you already know from the :doc:`Quick start <../quick-start>` guide, you only need to pass a lambda expression with the corresponding method and its arguments:

.. code-block:: c#

  BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

The ``Enqueue`` method does not call the target method immediately, it runs the following steps instead:

1. Serialize a method information and all its arguments.
2. Create a new background job based on the serialized information.
3. Save background job to a persistent storage.
4. Enqueue background job to its queue.

After these steps were performed, the ``BackgroundJob.Enqueue`` method immediately returns to a caller. Another Hangfire component, called :doc:`Hangfire Server <../background-processing/processing-background-jobs>`, checks the persistent storage for enqueued background jobs and performs them in a reliable way. 

Enqueued jobs are handled by a dedicated pool of worker threads. The following process is invoked by each worker:

1. Fetch next job and hide it from other workers.
2. Perform the job and all its extension filters.
3. Remove the job from the queue.

So, the job is removed only after processing succeeds. Even if a process was terminated during the performance, Hangfire will perform compensation logic to guarantee the processing of each job.

Each storage has its own implementation for each of these steps and compensation logic mechanisms:

* **SQL Server** implementation uses regular SQL transactions, so in case of a process termination, background job id is placed back on a queue instantly.
* **MSMQ** implementation uses transactional queues, so there is no need for periodic checks. Jobs are fetched almost immediately after enqueueing.
* **Redis** implementation uses blocking ``BRPOPLPUSH`` command, so jobs are fetched immediately, as with MSMQ. But in case of process termination, they are re-enqueued only after timeout expiration (30 minutes by default).
