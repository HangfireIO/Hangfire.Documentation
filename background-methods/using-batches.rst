Using Batches
==============

.. admonition:: Pro Only
   :class: note

   This feature is a part of `Hangfire Pro <https://www.hangfire.io/pro/>`_ package set

Batches allow you to create a bunch of background jobs *atomically*. This means that if there was an exception during the creation of background jobs, none of them will be processed. Consider you want to send 1000 emails to your clients, and they really want to receive these emails. Here is the old way:

.. code-block:: c#

   for (var i = 0; i < 1000; i++)
   {
       BackgroundJob.Enqueue(() => SendEmail(i));
       // What to do on exception?
   }

But what if storage become unavailable on ``i == 500``? 500 emails may be already sent, because worker threads will pick up and process jobs once they created. If you re-execute this code, some of your clients may receive annoying duplicates. So if you want to handle this correctly, you should write more code to track what emails were sent. 

But here is a much simpler method:

.. code-block:: c#

   BatchJob.StartNew(x =>
   {
       for (var i = 0; i < 1000; i++)
       {
           x.Enqueue(() => SendEmail(i));
       }
   });

In case of exception, you may show an error to a user, and simply ask to retry her action after some minutes. No other code required!

Installation
-------------

Batches are available in the `Hangfire.Pro <https://nuget.hangfire.io/feeds/hangfire-pro/Hangfire.Pro/>`_ package, and you can install it using NuGet Package Manager Console window as usually:

.. code-block:: powershell

   PM> Install-Package Hangfire.Pro

Batches require to add some additional job filters, some new pages to the Dashboard, and some new navigation menu items. But thanks to the new ``GlobalConfiguration`` class, it is now as simple as a one method call:

.. code-block:: c#

   GlobalConfiguration.Configuration.UseBatches();

.. admonition:: Limited storage support
   :class: warning

   Only official **Hangfire.InMemory**, **Hangfire.SqlServer** and **Hangfire.Pro.Redis** job storage implementations are currently supported. There is nothing special for batches, but some new storage methods should be implemented.

Configuration
--------------

The default batch job expiration/retention time if the batch succeeds is 7 days, but you can configure it when calling the ``UseBatches`` method:

.. code-block:: c#
    
   GlobalConfiguration.Configuration.UseBatches(TimeSpan.FromDays(2));


Chaining Batches
-----------------

Continuations allow you to chain multiple batches together. They will be executed once *all background jobs* of a parent batch finished. Consider the previous example where you have 1000 emails to send. If you want to make final action after sending, just add a continuation:

.. code-block:: c#

   var id1 = BatchJob.StartNew(/* for (var i = 0; i < 1000... */);
   var id2 = BatchJob.ContinueBatchWith(id1, x => 
   {
       x.Enqueue(() => MarkCampaignFinished());
       x.Enqueue(() => NotifyAdministrator());
   });

So batches and batch continuations allow you to define workflows and configure what actions will be executed in parallel. This is very useful for heavy computational methods as they can be distributed to different machines.

Complex Workflows
------------------

Create action does not restrict you to create jobs only in *Enqueued* state. You can schedule jobs to execute later, add continuations, add continuations to continuations, etc..

.. code-block:: c#

   var batchId = BatchJob.StartNew(x =>
   {
       x.Enqueue(() => Console.Write("1a... "));
       var id1 = x.Schedule(() => Console.Write("1b... "), TimeSpan.FromSeconds(1));
       var id2 = x.ContinueJobWith(id1, () => Console.Write("2... "));
       x.ContinueJobWith(id2, () => Console.Write("3... "));
   });
   
   BatchJob.ContinueBatchWith(batchId, x =>
   {
       x.Enqueue(() => Console.WriteLine("4..."));
   });

Nested Batches
--------------

Since version 2.0, **batches can consist of other batches**, not only of background jobs. Outer batch is called as *parent*, inner batch is a *child* one (for continuations, it's an *antecedent/continuation* relationship). You can mix both batches and background jobs together in a single batch.

.. code-block:: c#

   BatchJob.StartNew(parent =>
   {
       parent.Enqueue(() => Console.WriteLine("First"));
       parent.StartNew(child => child.Enqueue(() => Console.WriteLine("Second")));
   });

**Multiple nesting levels are supported**, so each child batch can, in turn, become a parent for another batch, allowing you to create very complex batch hierarchies.

.. code-block:: c#

   BatchJob.StartNew(batch1 =>
   {
       batch1.StartNew(batch2 =>
       {
           batch2.StartNew(batch3 => batch3.Enqueue(() => Console.WriteLine("Nested")));
       });
   });

The whole hierarchy, including parent batch, all of its child batches and background jobs are created in a single transaction. So this feature not only allows you to see a group of related batches on a single dashboard page, but also **create multiple batches atomically**.

.. code-block:: c#

   var antecedentId = BatchJob.StartNew(batch =>
   {
       batch.StartNew(inner => inner.Enqueue(() => Console.WriteLine("First")));
       batch.StartNew(inner => inner.Enqueue(() => Console.WriteLine("Second")));
   });

Parent batch is *succeeded*, if all of its background jobs and batches are *succeeded*. Parent batch is *finished*, if all of its batches and background jobs are in a *final* state. So you can **create continuation for multiple batches**, not just for a single one. Batch continuations also support the nesting feature.

.. code-block:: c#

   BatchJob.ContinueBatchWith(antecedentId, continuation =>
   {
       continuation.StartNew(inner => inner.Enqueue(() => Console.WriteLine("First")));
       continuation.StartNew(inner => inner.Enqueue(() => Console.WriteLine("Second")));
   });

Starting from Hangfire.Pro 2.1.0 it's also possible to use continuations in batches, both standalone and nested ones, for both batches and background jobs.

.. code-block:: c#

   BatchJob.StartNew(parent =>
   {
       var nested1 = parent.StartNew(nested =>
       {
           nested.Enqueue(() => Console.WriteLine("Nested 1"));
       });
       
       var nested2 = parent.ContinueBatchWith(nested1, () => Console.WriteLine("Nested 2"));
       
       var nested3 = parent.ContinueJobWith(nested2, nested =>
       {
           nested.Enqueue(() => Console.WriteLine("Nested 3"));
       });
       
       string nested5 = null;
       
       var nested4 = parent.ContinueBatchWith(nested3, nested =>
       {
           nested5 = nested.Enqueue(() => Console.WriteLine("Nested 4"));
       });
       
       parent.ContinueJobWith(nested5, () => Console.WriteLine("Nested 5"));
   });

Batch Modification
------------------

This is another interesting feature available from version 2.0 that allows you to **modify existing batches** by attaching new background jobs and child batches to them. You can add background jobs in any states, as well as nested batches. If a modified batch has already been finished, it will be moved back to the *started* state.

.. code-block:: c#

   var batchId = BatchJob.StartNew(batch => batch.Enqueue(() => Console.WriteLine("First")));
   BatchJob.Attach(batchId, batch => batch.Enqueue(() => Console.WriteLine("Second")));

This feature helps, if you want a list of records you want to process in parallel, and then execute a continuation. Previously you had to generate a very long chain of continuations, and it was very hard to debug them. So you can create the structure, and modify a batch later.

.. code-block:: c#

   var batchId = BatchJob.StartNew(batch => batch.Enqueue(() => ProcessHugeList(batch.Id, ListId)));
   BatchJob.ContinueBatchWith(batchId, batch => batch.Enqueue(() => SendNotification(ListId)));

.. code-block:: c#

   // ProcessHugeList
   BatchJob.Attach(batchId, batch => 
   {
       foreach (var record in records)
       {
           batch.Enqueue(() => ProcessRecord(ListId, record.Id)));
       }
   });

Batches can be created without any background jobs. Initially such an empty batches are considered as *completed*, and once some background jobs or child batches are added, they move a batch to the *started* state (or to another, depending on their state).

.. code-block:: c#

   var batchId = BatchJob.StartNew(batch => {});
   BatchJob.Attach(batchId, batch => batch.Enqueue(() => Console.WriteLine("Hello, world!")));

More Continuations
------------------

Since version 2.0 it's possible to **continue batch with a regular background job** without creating a batch that consists only of a single background job. Unfortunately we can't add extension methods for static classes, so let's create a client first.

.. code-block:: c#

   var backgroundJob = new BackgroundJobClient();
   var batchId = BatchJob.StartNew(/* ... */);

   backgroundJob.ContinueBatchWith(batchId, () => Console.WriteLine("Continuation"));

You can use the new feature in other way, and create **batch continuations for regular background jobs**. So you are free to define workflows, where synchronous actions are continued by a group of parallel work, and then continue back to a synchronous method.

.. code-block:: c#

   var jobId = BackgroundJob.Enqueue(() => Console.WriteLine("Antecedent"));
   BatchJob.ContinueJobWith(jobId, batch => batch.Enqueue(() => Console.WriteLine("Continuation")));

Cancellation of a Batch
-----------------------

If you want to stop a batch with millions of background jobs from being executed, not a problem, you can call the `Cancel` method, or click the corresponding button in dashboard. 

.. code-block:: c#

   var batchId = BatchJob.StartNew(/* a lot of jobs */);
   BatchJob.Cancel(batchId);

This method **does not** iterate through all the jobs, it simply sets a property of a batch. When a background job is about to execute, job filter checks for a batch status, and move a job to the *Deleted* state, if a batch has cancelled.
