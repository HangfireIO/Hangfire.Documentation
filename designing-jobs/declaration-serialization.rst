Declaration and Serialization
==============================

.. admonition:: Under construction
   :class: warning

   Declaration and serialization: supported methods (instance, scoped, static, public, async, interface/implementation, return, async void isn’t supported), arguments (JSON serialization, primitive types best, complex types, controlling serialization, limitations, dependencies, Hangfire types), supported types (base classes, constructor parameters, dependencies, activation, IoC containers, use interfaces to apply filters), type, method, argument serialization (not supported: out, ref parameters, delegates, expressions), passed object isn’t serialized, IDisposable. Generics types and methods. Open generic parameters.

Passing Arguments
------------------

You can pass additional data to your background jobs as a regular method arguments. I'll write the following line once again (hope it hasn't bothered you):

.. code-block:: c#

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, {0}!", "world"));

As in a regular method call, these arguments will be available for the ``Console.WriteLine`` method during the performance of the background job. But since they are marshaled through process boundaries, they are serialized.

The **awesome** `Newtonsoft.Json <http://james.newtonking.com/json>`_ package is used to serialize arguments into JSON strings (since version ``1.1.0``). So you can use almost any type as a parameter; including arrays, collections and custom objects. Please see `corresponding documentation <http://james.newtonking.com/json/help/index.html>`_ for more details.

.. admonition:: Reference parameters are not supported
   :class: note

   You can not pass arguments to parameters by reference – ``ref`` and ``out`` keywords are **not supported**.

Since arguments are serialized, consider their values carefully as they can blow up your job storage. Most of the time it is more efficient to store concrete values in an application database and pass their identifiers only to your background jobs.

Remember that background jobs may be processed days or weeks after they were enqueued. If you use data that is subject to change in your arguments, it may become stale – database records may be deleted, the text of an article may be changed, etc. Plan for these changes and design your background jobs accordingly.

Passing dependencies
---------------------

In almost every job you'll want to use other classes of your application to perform different work and keep your code clean and simple. Let's call these classes as *dependencies*. How to pass these dependencies to methods that will be called in background?

When you are calling static methods in background, you are restricted only to the static context of your application, and this requires you to use the following patterns of obtaining dependencies:

* Manual dependency instantiation through the ``new`` operator
* `Service location <http://en.wikipedia.org/wiki/Service_locator_pattern>`_
* `Abstract factories <http://en.wikipedia.org/wiki/Abstract_factory_pattern>`_ or `builders <http://en.wikipedia.org/wiki/Builder_pattern>`_
* `Singletons <http://en.wikipedia.org/wiki/Singleton_pattern>`_

However, all of these patterns greatly complicate the unit testability aspect of your application. To fight with this issue, Hangfire allows you to call instance methods in background. Consider you have the following class that uses some kind of ``DbContext`` to access the database, and ``EmailService`` to send emails.

.. code-block:: c#

    public class EmailSender
    {
        public void Send(int userId, string message) 
        {
            var dbContext = new DbContext();
            var emailService = new EmailService();

            // Some processing logic
        }
    }

To call the ``Send`` method in background, use the following override of the ``Enqueue`` method (other methods of ``BackgroundJob`` class provide such overloads as well):

.. code-block:: c#

   BackgroundJob.Enqueue<EmailSender>(x => x.Send(13, "Hello!"));

When a worker determines that it need to call an instance method, it creates the instance of a given class first using the current ``JobActivator`` class instance. By default, it uses the ``Activator.CreateInstance`` method that can create an instance of your class using **its default constructor**, so let's add it:

.. code-block:: c#

   public class EmailSender
   {
       private IDbContext _dbContext;
       private IEmailService _emailService;

       public EmailSender()
       {
           _dbContext = new DbContext();
           _emailService = new EmailService();
       } 

       // ...
   }

If you want the class to be ready for unit testing, consider to add constructor overload, because the **default activator can not create instance of class that has no default constructor**:

.. code-block:: c#

    public class EmailSender
    {
        // ...

        public EmailSender()
            : this(new DbContext(), new EmailService())
        {
        }

        internal EmailSender(IDbContext dbContext, IEmailService emailService)
        {
            _dbContext = dbContext;
            _emailService = emailService;
        }
    }

If you are using IoC containers, such as Autofac, Ninject, SimpleInjector and so on, you can remove the default constructor. To learn how to do this, proceed to the next section.

Using IoC containers
---------------------

As I said in the :doc:`previous section <passing-dependencies>` Hangfire uses the ``JobActivator`` class to instantiate the target types before invoking instance methods. You can override its behavior to perform more complex logic on a type instantiation. For example, you can tell it to use IoC container that is used in your project:

.. code-block:: c#

   public class ContainerJobActivator : JobActivator
   {
       private IContainer _container;

       public ContainerJobActivator(IContainer container)
       {
           _container = container;
       }

       public override object ActivateJob(Type type)
       {
           return _container.Resolve(type);
       }
   }

Then, you need to register it as a current job activator before starting the Hangfire server:

.. code-block:: c#

   // Somewhere in bootstrap logic, for example in the Global.asax.cs file
   var container = new Container();
   GlobalConfiguration.Configuration.UseActivator(new ContainerJobActivator(container));
   ...
   app.UseHangfireServer();

To simplify the initial installation, there are some integration  packages already available on NuGet:

* `Hangfire.Autofac <https://www.nuget.org/packages/Hangfire.Autofac/>`_
* `Hangfire.Ninject <https://www.nuget.org/packages/Hangfire.Ninject/>`_
* `Hangfire.SimpleInjector <https://www.nuget.org/packages/Hangfire.SimpleInjector/>`_
* `Hangfire.Windsor <https://www.nuget.org/packages/Hangfire.Windsor/>`_

Some of these activators also provide an extension method for the ``GlobalConfiguration`` class:

.. code-block:: c#

   GlobalConfiguration.Configuration.UseNinjectActivator(kernel);

.. admonition:: ``HttpContext`` is not available
   :class: warning
   
   Request information is not available during the instantiation of a target type. If you register your dependencies in a request scope (``InstancePerHttpRequest`` in Autofac, ``InRequestScope`` in Ninject and so on), an exception will be thrown during the job activation process.

So, **the entire dependency graph should be available**. Either register additional services without using the request scope, or use separate instance of container if your IoC container does not support dependency registrations for multiple scopes.
