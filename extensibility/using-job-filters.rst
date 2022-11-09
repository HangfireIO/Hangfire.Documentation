Using Job Filters
==================

All processes are implemented with Chain-of-responsibility pattern and can be intercepted like with ASP.NET MVC Action Filters.

**Define the filter**

.. code-block:: c#

    public class LogEverythingAttribute : JobFilterAttribute,
        IClientFilter, IServerFilter, IElectStateFilter, IApplyStateFilter
    {
        private static readonly ILog Logger = LogProvider.GetCurrentClassLogger();

        public void OnCreating(CreatingContext context)
        {
            Logger.InfoFormat("Creating a job based on method `{0}`...", context.Job.Method.Name);
        }

        public void OnCreated(CreatedContext context)
        {
            Logger.InfoFormat(
                "Job that is based on method `{0}` has been created with id `{1}`",
                context.Job.Method.Name,
                context.BackgroundJob?.Id);
        }

        public void OnPerforming(PerformingContext context)
        {
            Logger.InfoFormat("Starting to perform job `{0}`", context.BackgroundJob.Id);
        }

        public void OnPerformed(PerformedContext context)
        {
            Logger.InfoFormat("Job `{0}` has been performed", context.BackgroundJob.Id);
        }

        public void OnStateElection(ElectStateContext context)
        {
            var failedState = context.CandidateState as FailedState;
            if (failedState != null)
            {
                Logger.WarnFormat(
                    "Job `{0}` has been failed due to an exception `{1}`",
                    context.BackgroundJob.Id,
                    failedState.Exception);
            }
        }

        public void OnStateApplied(ApplyStateContext context, IWriteOnlyTransaction transaction)
        {
            Logger.InfoFormat(
                "Job `{0}` state was changed from `{1}` to `{2}`",
                context.BackgroundJob.Id,
                context.OldStateName,
                context.NewState.Name);
        }

        public void OnStateUnapplied(ApplyStateContext context, IWriteOnlyTransaction transaction)
        {
            Logger.InfoFormat(
                "Job `{0}` state `{1}` was unapplied.", 
                context.BackgroundJob.Id, 
                context.OldStateName);
        }
    }

**Apply it**

Like ASP.NET filters, you can apply filters on method, class and globally:

.. code-block:: c#

    [LogEverything]
    public class EmailService
    {
        [LogEverything]
        public static void Send() { }
    }

    GlobalJobFilters.Filters.Add(new LogEverythingAttribute());

If your service is resolved via interface, then the filter should be applied to your interface instead of class:

.. code-block:: c#

    [LogEverything]
    public interface IEmailService
    {
        [LogEverything]
        void Send() { }
    }


