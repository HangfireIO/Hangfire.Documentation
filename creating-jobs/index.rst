Creating Jobs
==============

.. admonition:: Under construction
   :class: warning

   Creating: it’s called client, job vs background job, backgroundjob, background job client, recurringjob, recurring job manager, batch client, dynamic job creation using Job, catching exceptions, retry for azure, null id when canceled, static, generic, scoped, client filters, job definition. Creation is synchronous, ack is required. Serialization.

Hangfire provides a really simply programming interface to create background jobs. No special classes or interfaces needed, all you need is to specify what method to call and what arguments to use. Please note this is not delegates, it's expression trees. There are a couple of classes that provide methods for creating different types of background jobs, we call them Hangfire Client API for simplicity.

.. code-block:: c#

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

Instead of calling a method, the following steps are performed:

1. Serialize type and method information to uniquely identift what method to call.
2. Serialize all the given arguments.
3. Call the client filters.
4. Persist a background jobs to a storage, and background job id is returned.

If all of these steps are performed without any exception, and non-null job id is returned, your background job is successfully created, and will be performed with the *at least once* guarantee (please note that retries are possible to satisfy this guarantee), and it will not be lost even after an unexpected process termination.

**Classes**

.. code-block:: c#

   BackgroundJob.Enqueue<MyClass>(x => x.Method("args"));

**Interfaces**

.. code-block:: c#

   BackgroundJob.Enqueue<IMyInterface>(x => x.Method("args"));

**Scoped instance**

.. code-block:: c#

   var scoped = new MyClass();
   BackgroundJob.Enqueue(() => scoped.Method("args"));

**Async methods**

.. code-block:: c#

   BackgroundJob.Enqueue<IMyInterface>(x => x.MethodAsync("args"));

.. code-block:: c#
   
   var id = BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

BackgroundJobClient class
--------------------------

Yes, I know static classes are bad for design, but they are so simple for demonstration purposes. For advanced programmers there is the ``IBackgroundJobClient`` interface and the ``BackgroundJobClient`` class that is an implementation of that interface. So you can use them for satisfying the inversion of control principle.

The static ``BackgroundJob`` class is just a wrapper, so methods are almost the same in all of these types, but there are some additional extension ones for the ``IBackgroundJobClient``.

.. code-block:: c#

   IBackgroundJobClient backgroundJob = new BackgroundJobClient();
   backgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

Yet another feature for using the ``BackgroundJobClient`` class is an ability to pass a custom storage instance.

.. code-block:: c#

   var backgroundJob = new BackgroundJobClient(new MyStorage());

Dealing with exceptions
------------------------

.. code-block:: c#

   try
   {
       BackgroundJob.Enqueue(() => Console.WriteLine());
   }
   catch (BackgroundJobClientException ex)
   {
       Console.WriteLine(ex);
   }

Low-level creation
-------------------

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