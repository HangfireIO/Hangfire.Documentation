Creating Jobs
==============

.. admonition:: Under construction
   :class: warning

   Creating: it’s called client, job vs background job, backgroundjob, background job client, recurringjob, recurring job manager, batch client, dynamic job creation using Job, catching exceptions, retry for azure, null id when canceled, static, generic, scoped, client filters, job definition. Creation is synchronous, ack is required.

.. code-block:: c#

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

.. code-block:: c#

   BackgroundJob.Enqueue<MyClass>(x => x.Method("args"));

.. code-block:: c#

   BackgroundJob.Enqueue<IMyInterface>(x => x.Method("args"));

.. code-block:: c#

   var scoped = new MyClass();
   BackgroundJob.Enqueue(() => scoped.Method("args"));

.. code-block:: c#

   BackgroundJob.Enqueue<IMyInterface>(x => x.MethodAsync("args"));

.. code-block:: c#
   
   var id = BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

.. code-block:: c#

   IBackgroundJobClient backgroundJob = new BackgroundJobClient();
   backgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

.. code-block:: c#

   var backgroundJobClient = new BackgroundJobClient(new MyStorage());

.. code-block:: c#

   try
   {
       BackgroundJob.Enqueue(() => Console.WriteLine());
   }
   catch (BackgroundJobClientException ex)
   {
       Console.WriteLine(ex);
   }

.. code-block:: c#

   var backgroundJob = new BackgroundJobClient();
   var type = typeof(Console);
   var method = type.GetMethod("WriteLine", new [] { typeof(string) });

   var job = new Job(type, method, "Hello, world!");
   var state = new EnqueuedState();

   backgroundJob.Create(job, state);

.. toctree::
   :maxdepth: 1
   :hidden:

   fire-and-forget
   delayed
   continuations
   recurring
   batches
   processes
   extensibility